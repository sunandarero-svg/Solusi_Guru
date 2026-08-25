import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class, Enrollment, TeacherClass } from "@/models/Class";
import { StudentProfile, TeacherProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    // Ensure models are registered
    StudentProfile.init();
    TeacherProfile.init();

    const classData = await Class.findById(resolvedParams.id).lean();

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get enrollments
    const enrollments = await Enrollment.find({ classId: classData._id })
      .populate('studentId', 'fullName email studentNumber')
      .lean();

    // Get teachers
    const teachers = await TeacherClass.find({ classId: classData._id })
      .populate('teacherId', 'fullName email')
      .lean();

    const formattedData = {
      ...classData,
      enrollments: enrollments.map(e => ({ student: e.studentId })),
      teachers: teachers.map(t => ({ teacher: t.teacherId }))
    };

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("GET Class details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
