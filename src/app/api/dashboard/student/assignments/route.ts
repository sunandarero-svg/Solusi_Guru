import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import { Assignment, AssignmentStatus } from "@/models/Assignment";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
    const classIds = enrollments.map(e => e.classId);

    const activeAssignments = await Assignment.find({
      classId: { $in: classIds },
      status: AssignmentStatus.PUBLISHED,
    })
    .sort({ dueDate: 1 })
    .lean();

    // Map to string IDs
    const formatted = activeAssignments.map(a => ({
      id: a._id.toString(),
      title: a.title,
      dueDate: a.dueDate,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Student active assignments API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
