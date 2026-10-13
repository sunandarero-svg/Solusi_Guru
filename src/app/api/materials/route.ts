import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { Enrollment, Class } from "@/models/Class";
import { Material } from "@/models/Material";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

// Tipe MIME yang didukung
const MIME_TO_FILETYPE: Record<string, 'video' | 'pdf' | 'docx' | 'ppt'> = {
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "ppt",
  "application/vnd.ms-powerpoint": "ppt",
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get("classId");

    if (session.user.role === "TEACHER") {
      const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
      if (!teacherProfile) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }

      const query: any = { teacherId: teacherProfile._id };
      if (classIdParam && classIdParam !== "all") {
        query.classId = classIdParam;
      }

      const materials = await Material.find(query)
        .populate("classId", "name")
        .populate("subjectId", "name")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(materials);
    }

    if (session.user.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }

      const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
      const classIds = enrollments.map((e) => e.classId);

      const materials = await Material.find({
        classId: { $in: classIds },
        isPublished: true,
      })
        .populate("classId", "name")
        .populate("subjectId", "name")
        .sort({ createdAt: -1 })
        .lean();

      const mapped = materials.map((m: any) => ({
        ...m,
        id: m._id.toString(),
        isReadByMe: m.readByStudents?.some((sId: any) => sId.toString() === studentProfile._id.toString()),
      }));

      return NextResponse.json(mapped);
    }

    // Role Admin / Principal
    const allMaterials = await Material.find({})
      .populate("classId", "name")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(allMaterials);
  } catch (error: any) {
    console.error("[Materials GET Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized. Hanya guru yang dapat membuat materi." }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Pembuatan Materi dari JSON (biasanya dari Generator AI)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { title, description, classId, subjectId, content, summary } = body;

      if (!title || !classId) {
        return NextResponse.json({ error: "Judul dan Tujuan Kelas wajib diisi." }, { status: 400 });
      }

      const cls = await Class.findById(classId).lean();

      const material = await Material.create({
        title,
        description: description || "",
        classId,
        className: cls?.name || "Kelas",
        subjectId: subjectId || null,
        teacherId: teacherProfile._id,
        sourceType: "AI",
        fileType: "text",
        content: content || "",
        summary: summary || "",
        isPublished: true,
        readByStudents: [],
      });

      return NextResponse.json({ success: true, data: material });
    }

    // 2. Pembuatan Materi dari FormData (Upload Manual Video, PDF, DOCX, PPT)
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;
    const file = formData.get("file") as File;

    if (!title || !classId) {
      return NextResponse.json({ error: "Judul dan Tujuan Kelas wajib diisi." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "File materi wajib diunggah." }, { status: 400 });
    }

    const fileType = MIME_TO_FILETYPE[file.type] || (file.name.endsWith(".ppt") || file.name.endsWith(".pptx") ? "ppt" : "other");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan folder public/uploads/materials tersedia
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
    await mkdir(uploadsDir, { recursive: true });

    // Buat nama file unik
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/materials/${uniqueFileName}`;

    // Ekstraksi teks otomatis jika PDF atau DOCX untuk bahan soal AI nanti
    let extractedText = "";
    try {
      if (fileType === "pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text?.substring(0, 8000) || "";
      } else if (fileType === "docx") {
        const mammoth = await import("mammoth");
        const docxData = await mammoth.extractRawText({ buffer });
        extractedText = docxData.value?.substring(0, 8000) || "";
      }
    } catch (parseErr) {
      console.warn("[Material File Text Extraction Warning]", parseErr);
    }

    const cls = await Class.findById(classId).lean();

    const material = await Material.create({
      title,
      description,
      classId,
      className: cls?.name || "Kelas",
      subjectId: subjectId || null,
      teacherId: teacherProfile._id,
      sourceType: "MANUAL_UPLOAD",
      fileUrl,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      content: extractedText,
      isPublished: true,
      readByStudents: [],
    });

    return NextResponse.json({ success: true, data: material });
  } catch (error: any) {
    console.error("[Materials POST Error]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
