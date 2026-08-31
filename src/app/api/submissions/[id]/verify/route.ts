import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import { readFile } from "fs/promises";
import path from "path";

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

    if (!submission.pages || submission.pages.length === 0) {
      return NextResponse.json({ error: "No pages found for verification" }, { status: 400 });
    }

    // AI Feasibility Check using Gemini
    const keysStr = process.env.GEMINI_API_KEYS;
    let apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/['"]/g, '').trim() : undefined;
    
    if (keysStr) {
      const keys = keysStr.split(',').map(k => k.replace(/['"]/g, '').trim()).filter(Boolean);
      if (keys.length > 0) {
        apiKey = keys[Math.floor(Math.random() * keys.length)];
      }
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured." }, { status: 500 });
    }

    try {
      const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              feasible: { type: SchemaType.BOOLEAN, description: "Apakah seluruh tulisan di SEMUA halaman cukup jelas untuk dibaca?" },
              readabilityScore: { type: SchemaType.INTEGER, description: "Skor keseluruhan dari 0-100" },
              reason: { type: SchemaType.STRING, description: "Alasan spesifik, misal: 'Halaman 2 buram pada paragraf 1' atau 'Semua halaman jelas'." }
            },
            required: ["feasible", "readabilityScore", "reason"]
          }
        }
      });
      
      const prompt = `Anda adalah AI pemeriksa kelayakan foto tugas sekolah. Anda menerima ${submission.pages.length} halaman foto sekaligus. Tugas Anda:
1. Pastikan Anda membaca SELURUH teks di setiap halaman dari awal hingga akhir.
2. Mengecek apakah tulisan tangan di SEMUA halaman dapat dibaca jelas, tidak terpotong, dan pencahayaannya baik.
3. Memberikan skor keterbacaan keseluruhan (readabilityScore) dari 0-100.
4. Hitung kesalahan (typo, salah tulis, kata buram, kata terpotong) di semua halaman. DILARANG KERAS menebak kata yang buram.
5. ATURAN KETAT: Jika terdapat >= 5 kesalahan SECARA KESELURUHAN atau JIKA ADA SATU SAJA HALAMAN YANG BURAM/TIDAK TERBACA, Anda WAJIB memberikan skor di bawah 85 (misal 84 atau lebih rendah) dan set 'feasible' ke false. Berikan rekomendasi spesifik (misal: "Tulisan di Halaman 2 paragraf 2 buram, mohon tulis ulang/foto kembali halaman 2").
6. Jika semua halaman jelas dan kesalahan total < 5, berikan skor 85 atau lebih tinggi dan set 'feasible' ke true. Tugas ini layak diperiksa.`;
      
      // Prepare image parts
      const imageParts = [];
      for (const page of submission.pages) {
        const filePath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ''));
        const buffer = await readFile(filePath);
        imageParts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: page.mimeType || "image/jpeg"
          }
        });
      }

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (parsed.feasible === false || parsed.readabilityScore < 85) {
        return NextResponse.json({ 
          error: "AI_REJECTION",
          score: parsed.readabilityScore,
          reason: parsed.reason 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        aiResult: parsed
      });

    } catch (aiError) {
      console.error("AI Verify check error:", aiError);
      return NextResponse.json({ error: "Gagal memverifikasi kelayakan foto dengan AI." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Verify pages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
