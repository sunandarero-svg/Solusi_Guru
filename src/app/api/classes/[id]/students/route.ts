import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class } from "@/models/Class";
import { StudentProfile } from "@/models/Profile";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    const classData = await Class.findById(resolvedParams.id);
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { students } = await req.json(); // Expected: [{ fullName: string, studentNumber: string }]

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "Data siswa tidak valid atau kosong" }, { status: 400 });
    }

    let addedCount = 0;

    for (const student of students) {
      if (!student.fullName || !student.studentNumber) continue;

      // Check if student profile exists by studentNumber (NIS)
      let studentProfile = await StudentProfile.findOne({ studentNumber: student.studentNumber });

      if (!studentProfile) {
        // Create new student profile
        studentProfile = await StudentProfile.create({
          fullName: student.fullName,
          studentNumber: student.studentNumber,
          // Generate a fake email just in case the schema requires it
          email: `${student.studentNumber}@student.local`
        });
      }

      // Check if student is already in this class
      const isEnrolled = classData.enrollments.some(
        (e: any) => e.student.toString() === studentProfile._id.toString()
      );

      if (!isEnrolled) {
        classData.enrollments.push({
          student: studentProfile._id,
          enrolledAt: new Date()
        });
        addedCount++;
      }
    }

    await classData.save();

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menambahkan ${addedCount} siswa baru ke kelas ini.` 
    });
  } catch (error: any) {
    console.error("POST Class students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
