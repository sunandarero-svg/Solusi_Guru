import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    const { prisma } = await import("@/lib/prisma");

    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: resolvedParams.id
      },
      include: {
        student: true,
        aiAssessment: true,
        teacherReview: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
