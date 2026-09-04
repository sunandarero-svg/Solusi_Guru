import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { attachmentService, MAX_ATTACHMENT_SIZE, ALLOWED_MIME_TYPES } from "@/modules/attachment/attachmentService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) throw new Error("Unauthorized");

    const resolvedParams = await params;
    const attachments = await attachmentService.getAttachmentsByAssignment(resolvedParams.id);
    
    // Also get answer key
    const answerKey = await attachmentService.getAnswerKey(resolvedParams.id);

    return NextResponse.json({ attachments, answerKey });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized");

    const resolvedParams = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email! }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan PDF, DOCX, XLSX, JPG, atau PNG." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file melebihi batas ${MAX_ATTACHMENT_SIZE / 1024}KB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const attachment = await attachmentService.createAttachment(
      resolvedParams.id,
      teacherProfile._id.toString(),
      buffer,
      file.name,
      file.type
    );

    return NextResponse.json(attachment);
  } catch (error: any) {
    console.error("[Attachment Upload Error]", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 400 }
    );
  }
}
