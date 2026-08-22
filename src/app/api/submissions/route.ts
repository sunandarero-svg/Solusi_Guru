import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";

export async function POST(req: NextRequest) {
  try {
    const session = await requireStudentSession();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: session.user.email } }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { assignmentId } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    const submission = await submissionService.createDraftSubmission(assignmentId, studentProfile.id);
    return NextResponse.json(submission);
  } catch (error: any) {
    console.error("Create draft submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
