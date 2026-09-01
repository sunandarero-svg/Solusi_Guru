import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { TeacherClass } from "@/models/Class";
import "@/models/Class";
import "@/models/Subject";
import { mapId } from "@/lib/mapId";

export async function GET() {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const teacherClasses = await TeacherClass.find({ teacherId: teacher._id })
      .populate('classId')
      .populate('subjectId')
      .lean();

    // Group subjects by class
    const classesMap = new Map();

    teacherClasses.forEach((tc: any) => {
      if (!tc.classId) return;

      const classId = tc.classId._id.toString();
      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: tc.classId._id.toString(),
          name: tc.classId.name,
          subjects: []
        });
      }

      if (tc.subjectId) {
        const subjects = classesMap.get(classId).subjects;
        const subjectIdStr = tc.subjectId._id.toString();
        if (!subjects.some((s: any) => s.id === subjectIdStr)) {
          subjects.push({
            id: subjectIdStr,
            name: tc.subjectId.name,
          });
        }
      }
    });

    return NextResponse.json(Array.from(classesMap.values()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

