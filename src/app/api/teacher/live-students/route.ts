import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { TeacherClass, Enrollment, Class } from "@/models/Class";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    // 1. Get teacher's classes
    const teacherClasses = await TeacherClass.find({ teacherId: teacher._id }).populate('classId').lean();
    const classIds = teacherClasses.map((tc: any) => tc.classId?._id).filter(Boolean);

    // Create a mapping of class ID to class name for easy lookup
    const classMap = new Map();
    teacherClasses.forEach((tc: any) => {
      if (tc.classId) {
        classMap.set(tc.classId._id.toString(), tc.classId.name);
      }
    });

    // 2. Get enrollments for these classes
    const enrollments = await Enrollment.find({ classId: { $in: classIds } }).lean();
    
    // Map student ID to their classes
    const studentClassMap = new Map();
    enrollments.forEach((e: any) => {
      const sId = e.studentId.toString();
      const cId = e.classId.toString();
      if (!studentClassMap.has(sId)) {
        studentClassMap.set(sId, []);
      }
      studentClassMap.get(sId).push(classMap.get(cId));
    });

    const studentIds = enrollments.map((e: any) => e.studentId);

    // 3. Get Student Profiles populated with User info
    const students = await StudentProfile.find({ _id: { $in: studentIds } })
      .populate({ path: 'userId', select: 'lastActiveAt email' })
      .lean();

    const now = new Date().getTime();
    const TWO_MINUTES_MS = 2 * 60 * 1000;

    const result = students.map((s: any) => {
      const lastActiveAt = s.userId?.lastActiveAt ? new Date(s.userId.lastActiveAt).getTime() : 0;
      const isOnline = now - lastActiveAt < TWO_MINUTES_MS;

      return {
        id: s._id.toString(),
        fullName: s.fullName,
        studentNumber: s.studentNumber,
        email: s.userId?.email || '',
        classes: studentClassMap.get(s._id.toString()) || [],
        lastActiveAt: s.userId?.lastActiveAt || null,
        isOnline
      };
    });

    // Sort: Online first, then by name
    result.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

    return NextResponse.json({ students: result });
  } catch (error: any) {
    console.error("Live Students Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
