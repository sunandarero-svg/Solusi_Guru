import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import bcrypt from "bcrypt";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { studentIds, action } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Pilih setidaknya satu siswa" }, { status: 400 });
    }

    await dbConnect();

    // Get the user IDs associated with these students
    const students = await StudentProfile.find({ _id: { $in: studentIds } }).lean();
    const userIds = students.map((s: any) => s.userId);

    if (action === "reset-password") {
      const defaultPassword = await bcrypt.hash("siswa123", 10);
      await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { passwordHash: defaultPassword } }
      );
      return NextResponse.json({ success: true, message: "Password berhasil di-reset menjadi siswa123." });
    }

    if (action === "delete") {
      await User.deleteMany({ _id: { $in: userIds } });
      await StudentProfile.deleteMany({ _id: { $in: studentIds } });
      return NextResponse.json({ success: true, message: "Siswa berhasil dihapus." });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
