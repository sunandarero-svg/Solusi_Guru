import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { Material } from "@/models/Material";
import { Class } from "@/models/Class";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized. Hanya guru yang dapat menduplikasi materi." }, { status: 401 });
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

    const resolvedParams = await params;
    const body = await req.json();
    const { classId, subjectId } = body;

    if (!classId) {
      return NextResponse.json({ error: "Kelas tujuan wajib dipilih." }, { status: 400 });
    }

    // 1. Ambil materi asli
    const originalMaterial = await Material.findById(resolvedParams.id).lean();
    if (!originalMaterial) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    // Pastikan guru adalah pemilik materi
    if (originalMaterial.teacherId.toString() !== teacherProfile._id.toString()) {
      return NextResponse.json({ error: "Anda hanya dapat menduplikasi materi milik Anda sendiri." }, { status: 403 });
    }

    // 2. Ambil info kelas tujuan
    const targetClass = await Class.findById(classId).lean();
    if (!targetClass) {
      return NextResponse.json({ error: "Kelas tujuan tidak ditemukan." }, { status: 404 });
    }

    // 3. Buat salinan materi ke kelas tujuan
    const duplicatedMaterial = await Material.create({
      title: originalMaterial.title,
      description: originalMaterial.description || "",
      classId: targetClass._id,
      className: targetClass.name,
      subjectId: subjectId || originalMaterial.subjectId || null,
      teacherId: teacherProfile._id,
      sourceType: originalMaterial.sourceType,
      fileUrl: originalMaterial.fileUrl || null,
      fileName: originalMaterial.fileName || null,
      fileType: originalMaterial.fileType || "text",
      fileSize: originalMaterial.fileSize || null,
      content: originalMaterial.content || "",
      summary: originalMaterial.summary || "",
      isPublished: true,
      readByStudents: [],
    });

    return NextResponse.json({
      success: true,
      message: `Materi "${originalMaterial.title}" berhasil diduplikasi ke ${targetClass.name}.`,
      data: duplicatedMaterial,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Material Duplicate Error]", error);
    return NextResponse.json({ error: error.message || "Gagal menduplikasi materi." }, { status: 500 });
  }
}
