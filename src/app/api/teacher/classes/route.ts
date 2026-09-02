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

      const classIdObj = tc.classId._id || tc.classId;
      const classIdStr = classIdObj.toString();
      const className = tc.classId.name || "Kelas Tidak Diketahui";

      if (!classesMap.has(classIdStr)) {
        classesMap.set(classIdStr, {
          id: classIdStr,
          name: className,
          subjects: []
        });
      }

      if (tc.subjectId) {
        const subjects = classesMap.get(classIdStr).subjects;
        const subjectIdObj = tc.subjectId._id || tc.subjectId;
        const subjectIdStr = subjectIdObj.toString();
        const subjectName = tc.subjectId.name || "Mata Pelajaran Tidak Diketahui";

        if (!subjects.some((s: any) => s.id === subjectIdStr)) {
          subjects.push({
            id: subjectIdStr,
            name: subjectName,
          });
        }
      }
    });

    return NextResponse.json(Array.from(classesMap.values()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

