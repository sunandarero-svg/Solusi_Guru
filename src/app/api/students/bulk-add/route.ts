import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { students, classId } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "Data siswa tidak valid" }, { status: 400 });
    }

    await dbConnect();

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const defaultPassword = await bcrypt.hash("siswa123", 10);

    for (const student of students) {
      try {
        if (!student.fullName || !student.studentNumber) {
          throw new Error("Nama dan NIS wajib diisi");
        }

        const email = `${student.studentNumber}@siswa.com`;
        
        // Check if exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error(`Siswa dengan NIS ${student.studentNumber} sudah ada`);
        }

        const newUser = await User.create({
          email,
          passwordHash: defaultPassword,
          role: Role.STUDENT
        });

        const studentProfile = await StudentProfile.create({
          userId: newUser._id,
          studentNumber: student.studentNumber,
          fullName: student.fullName
        });

        if (classId) {
          await Enrollment.create({
            classId,
            studentId: studentProfile._id
          });
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${results.success} siswa. Gagal: ${results.failed}.`,
      errors: results.errors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

