import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { assignmentService } from "@/modules/assignment/assignmentService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function GET(req: NextRequest) {
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

    const assignments = await assignmentService.getAllAssignments(teacherProfile._id.toString());
    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { title, classId, subjectId, description, instructions, deadline, maxPages } = body;

    if (!title || !classId || !subjectId) {
      return NextResponse.json({ error: "Title, Class, and Subject are required" }, { status: 400 });
    }

    const assignment = await assignmentService.createAssignment({
      teacherId: teacherProfile._id.toString(),
      classId,
      subjectId,
      title,
      description,
      instructions,
      deadline: deadline ? new Date(deadline) : undefined,
      maxPages: maxPages ? parseInt(maxPages) : undefined,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}
