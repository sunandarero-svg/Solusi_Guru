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
      const maxPage = submission.pages.reduce((max, p) => p.pageNumber > max ? p.pageNumber : max, 0);
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
