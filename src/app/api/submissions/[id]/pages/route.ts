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

    // AI Feasibility Check using Gemini 1.5 Flash
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Anda adalah AI pemeriksa kelayakan foto tugas sekolah. Tugas Anda HANYA mengecek apakah tulisan tangan di foto ini dapat dibaca, tidak terpotong, dan pencahayaannya baik. DILARANG KERAS menebak kata yang buram. Jika ada bagian yang ambigu, kembalikan 'feasible': false beserta alasan spesifik (maksimal 2 kalimat). Jika tulisan cukup jelas, kembalikan 'feasible': true. Output harus murni JSON dengan format {"feasible": boolean, "reason": "string"}.`;
        
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

        if (parsed.feasible === false) {
          return NextResponse.json({ error: `Ditolak AI: ${parsed.reason}` }, { status: 400 });
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
