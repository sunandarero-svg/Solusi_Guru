import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { Material } from "@/models/Material";
import path from "path";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();

    const material = await Material.findById(resolvedParams.id)
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("teacherId")
      .lean();

    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).lean();
    const teacherProfile = await TeacherProfile.findOne({ userId: user?._id }).lean();

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const material = await Material.findById(resolvedParams.id);
    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    if (material.teacherId.toString() !== teacherProfile._id.toString()) {
      return NextResponse.json({ error: "Hanya pembuat materi yang dapat menghapus" }, { status: 403 });
    }

    // Hapus file fisik jika ada (cek beberapa kemungkinan lokasi penyimpanan berkas)
    if (material.fileUrl && material.fileUrl.startsWith("/uploads/materials/")) {
      const cleanRelativePath = material.fileUrl.replace(/^\//, "");
      const possiblePaths = [
        path.join(process.cwd(), "public", cleanRelativePath),
        path.resolve(process.cwd(), "public", cleanRelativePath),
        // Mode Next.js standalone (.next/standalone), path root public 2 tingkat di atasnya
        path.resolve(process.cwd(), "..", "..", "public", cleanRelativePath),
        path.resolve("/app/public", cleanRelativePath),
      ];

      for (const p of possiblePaths) {
        try {
          if (existsSync(p)) {
            await unlink(p);
          }
        } catch (err: any) {
          // Abaikan jika berkas sudah tidak ada (ENOENT)
          if (err?.code !== "ENOENT") {
            console.warn("[Delete File Warning]", err);
          }
        }
      }
    }

    await Material.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ success: true, message: "Materi berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
