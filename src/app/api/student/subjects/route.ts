import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment, TeacherClass } from "@/models/Class";
import "@/models/Subject";
import { TeacherProfile } from "@/models/Profile";
import { mapId } from "@/lib/mapId";

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const student = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    // 1. Get class enrollments
    const enrollments = await Enrollment.find({ studentId: student._id }).populate('classId').lean();
    const classIds = enrollments.map((e: any) => e.classId?._id);

    // 2. Get subjects assigned to those classes by any teacher
    const teacherClasses = await TeacherClass.find({ classId: { $in: classIds } })
      .populate('subjectId')
      .populate('teacherId')
      .populate('classId')
      .lean();

    // Map to a nice output
    const subjects = teacherClasses
      .filter((tc: any) => tc.subjectId && tc.teacherId)
      .map((tc: any) => ({
        id: tc._id,
        subject: {
          id: tc.subjectId._id,
          name: tc.subjectId.name,
        },
        teacher: {
          id: tc.teacherId._id,
          fullName: tc.teacherId.fullName,
        },
        class: {
          id: tc.classId._id,
          name: tc.classId.name,
        }
      }));

    return NextResponse.json(mapId(subjects));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

