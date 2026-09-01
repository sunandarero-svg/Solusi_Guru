import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";

export async function POST(req: NextRequest) {
  try {
    const session = await requireStudentSession();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { assignmentId } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const submission = await submissionService.createDraftSubmission(assignmentId, studentProfile._id.toString());
    return NextResponse.json(submission);
  } catch (error: any) {
    console.error("Create draft submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

