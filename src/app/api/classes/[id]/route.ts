import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class } from "@/models/Class";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    const classData = await Class.findById(resolvedParams.id)
      .populate('enrollments.student', 'fullName email studentNumber')
      .populate('teachers.teacher', 'fullName email')
      .lean();

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // For now we allow any teacher to see any class, or you can restrict it
    // by fetching TeacherProfile using session.user.email and checking classData.teachers

    return NextResponse.json(classData);
  } catch (error: any) {
    console.error("GET Class details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
