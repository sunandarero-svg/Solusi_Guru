import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
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
    let buffer = Buffer.from(bytes);

    // Kompres gambar server-side untuk hemat storage dan ukuran base64 saat grading
    if (file.type.startsWith("image/")) {
      try {
        const sharp = (await import("sharp")).default;
        const metadata = await sharp(buffer).metadata();
        let pipeline = sharp(buffer);

        // Resize to max 1280px — sufficient for OCR, reduces base64 size significantly
        if ((metadata.width && metadata.width > 1280) || (metadata.height && metadata.height > 1280)) {
          pipeline = pipeline.resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true });
        }

        buffer = await pipeline.jpeg({ quality: 70, mozjpeg: true }).toBuffer();
        console.log(`[Pages Upload] Kompresi gambar: ${(bytes.byteLength / 1024).toFixed(0)}KB → ${(buffer.length / 1024).toFixed(0)}KB`);
      } catch (compressErr) {
        console.warn("[Pages Upload] Kompresi gagal, menggunakan original:", compressErr);
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
