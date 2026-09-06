import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Class, Enrollment } from "@/models/Class";
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

    if (!classId) {
      return NextResponse.json({ error: "Kelas tujuan harus dipilih" }, { status: 400 });
    }

    await dbConnect();

    let classPrefix = "00";
    let currentCount = 0;
    const cls = await Class.findById(classId);
    if (cls) {
      const digits = cls.name.replace(/\D/g, '');
      if (digits.length >= 2) {
        classPrefix = digits.substring(0, 2);
      } else if (digits.length === 1) {
        classPrefix = digits + "0";
      } else {
        classPrefix = "00"; 
      }
      currentCount = await Enrollment.countDocuments({ classId });
    } else {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const defaultPassword = await bcrypt.hash("siswa123", 10);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      try {
        if (!student.fullName) {
          throw new Error("Nama siswa wajib diisi");
        }

        let studentNumber = student.studentNumber;
        
        // Auto-generate studentNumber if not provided or if we want to enforce the rule
        if (!studentNumber) {
          const order = currentCount + results.success + 1;
          studentNumber = `${classPrefix}${String(order).padStart(2, '0')}`;
        }

        const email = `${studentNumber}@siswa.com`;
        
        // Check if exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error(`Siswa dengan NIS/Username ${studentNumber} sudah ada`);
        }

        const newUser = await User.create({
          email,
          passwordHash: defaultPassword,
          role: Role.STUDENT
        });

        const studentProfile = await StudentProfile.create({
          userId: newUser._id,
          studentNumber: studentNumber,
          fullName: student.fullName
        });

        await Enrollment.create({
          classId,
          studentId: studentProfile._id
        });

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

