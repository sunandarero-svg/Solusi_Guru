import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: session.user.email } }
    });

    if (!studentProfile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const resolvedParams = await props.params;
    
    // Check if student has submission
    const submission = await submissionService.getSubmissionByAssignmentAndStudent(
      resolvedParams.id, 
      studentProfile.id
    );

    return NextResponse.json(submission || null);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
