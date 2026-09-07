import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { assignmentService } from "@/modules/assignment/assignmentService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { classId, subjectId } = body;

    if (!classId || !subjectId) {
      return NextResponse.json({ error: "Class and Subject are required" }, { status: 400 });
    }

    const duplicatedAssignment = await assignmentService.duplicateAssignment(
      resolvedParams.id,
      teacherProfile._id.toString(),
      classId,
      subjectId
    );

    return NextResponse.json(duplicatedAssignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}
