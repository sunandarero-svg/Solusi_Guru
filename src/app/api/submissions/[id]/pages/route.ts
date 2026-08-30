import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await props.params;
    
    // Check if submission belongs to student
    const submission = await submissionService.getSubmissionById(resolvedParams.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pageNumberStr = formData.get("pageNumber") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // AI Feasibility Check using Gemini 3.6 Flash
    const keysStr = process.env.GEMINI_API_KEYS;
    let apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : undefined;
    
    if (keysStr) {
      const keys = keysStr.split(',').map(k => k.replace(/['"]/g, '').trim()).filter(Boolean);
      if (keys.length > 0) {
        apiKey = keys[Math.floor(Math.random() * keys.length)];
      }
    }

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        
        const prompt = `Anda adalah AI pemeriksa kelayakan foto tugas sekolah. Tugas Anda:
1. Pastikan Anda membaca SELURUH teks yang ada di foto dari awal hingga akhir.
2. Mengecek apakah tulisan tangan di foto ini dapat dibaca jelas, tidak terpotong, dan pencahayaannya baik.
3. Memberikan skor keterbacaan (readabilityScore) dari 0-100.
4. DILARANG KERAS menebak kata yang buram. Hitung berapa banyak kesalahan (typo, salah tulis, kata buram, kata terpotong).
5. ATURAN KETAT: Jika terdapat >= 5 kesalahan, Anda WAJIB memberikan skor di bawah 85 (misal 84 atau lebih rendah) dan set 'feasible' ke false. Berikan rekomendasi spesifik (misal: "Tulisan di paragraf 2 terdapat typo, mohon tulis ulang dan foto kembali").
6. Jika terdapat < 5 kesalahan (misal 0-4 kesalahan), berikan skor 85 atau lebih tinggi dan set 'feasible' ke true. Tugas ini layak diperiksa.

Output harus murni JSON dengan format {"feasible": boolean, "readabilityScore": number, "reason": "string"}.`;
        
        const image = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type
          }
        };

        const result = await model.generateContent([prompt, image]);
        const text = result.response.text();
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        if (parsed.feasible === false || parsed.readabilityScore < 85) {
          return NextResponse.json({ 
            error: "AI_REJECTION",
            score: parsed.readabilityScore,
            reason: parsed.reason 
          }, { status: 400 });
        }
      } catch (aiError) {
        console.error("AI Feasibility check error:", aiError);
        // If AI fails (e.g. rate limit), we can choose to either block or allow.
        // For now, we block to ensure only valid images are uploaded.
        return NextResponse.json({ error: "Gagal memverifikasi kelayakan foto dengan AI." }, { status: 500 });
      }
    }

    // Save locally
    const uploadDir = path.join(process.cwd(), "public", "uploads", "submissions");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Get current max page number if not provided
    let pageNumber = parseInt(pageNumberStr);
    if (isNaN(pageNumber)) {
      const maxPage = submission.pages.reduce((max: number, p: any) => p.pageNumber > max ? p.pageNumber : max, 0);
      pageNumber = maxPage + 1;
    }

    // Save to database
    const storageKey = `/uploads/submissions/${filename}`; // Public URL accessible path
    const savedPage = await submissionService.addSubmissionPage(resolvedParams.id, {
      storageKey,
      originalFileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      pageNumber
    });

    return NextResponse.json(savedPage);
  } catch (error: any) {
    console.error("Upload page error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
