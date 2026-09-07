import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const { assignmentId, studentId } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    let targetStudentId = "";

    if (session.user.role === "TEACHER") {
      if (!studentId) {
        return NextResponse.json({ error: "studentId is required for teacher submission" }, { status: 400 });
      }
      targetStudentId = studentId;
    } else if (session.user.role === "STUDENT") {
      const user = await User.findOne({ email: session.user.email }).lean();
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
      if (!studentProfile) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      targetStudentId = studentProfile._id.toString();
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    const submission = await submissionService.createDraftSubmission(assignmentId, targetStudentId);
    return NextResponse.json(submission);
  } catch (error: any) {
    console.error("Create draft submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

