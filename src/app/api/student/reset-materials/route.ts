import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import { Material } from "@/models/Material";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Role STUDENT: Reset status membaca untuk diri sendiri
    if (session.user.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
      if (!studentProfile) {
        return NextResponse.json({ error: "Profil siswa tidak ditemukan" }, { status: 404 });
      }

      const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
      const classIds = enrollments.map((e) => e.classId);

      // Tarik/hapus ID siswa ini dari seluruh array readByStudents pada materi kelasnya
      const updateResult = await Material.updateMany(
        { classId: { $in: classIds } },
        { $pull: { readByStudents: studentProfile._id } }
      );

      return NextResponse.json({
        success: true,
        message: "Status membaca materi berhasil di-reset. Semua fitur game dan foto tugas kembali terkunci hingga Anda membaca materi.",
        modifiedCount: updateResult.modifiedCount,
      });
    }

    // Role TEACHER / ADMIN: Bisa mereset untuk kelas tertentu jika dibutuhkan
    if (session.user.role === "TEACHER" || session.user.role === "ADMIN") {
      const body = await req.json().catch(() => ({}));
      const { classId } = body;
      if (!classId) {
        return NextResponse.json({ error: "classId diperlukan untuk reset materi oleh Guru/Admin" }, { status: 400 });
      }

      await Material.updateMany(
        { classId },
        { $set: { readByStudents: [] } }
      );

      return NextResponse.json({
        success: true,
        message: "Berhasil mereset status membaca materi untuk seluruh siswa di kelas.",
      });
    }

    return NextResponse.json({ error: "Akses tidak diizinkan untuk role ini" }, { status: 403 });
  } catch (error: any) {
    console.error("[Reset Materials Error]", error);
    return NextResponse.json({ error: error.message || "Gagal mereset status materi" }, { status: 500 });
  }
}
