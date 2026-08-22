import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { reviewService } from "@/modules/review/reviewService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    const { prisma } = await import("@/lib/prisma");

    const submission = await prisma.submission.findUnique({
      where: { id: resolvedParams.id },
      include: {
        student: true,
        document: true,
        ocrResults: {
          orderBy: { processedAt: 'desc' },
          take: 1
        },
        aiAssessment: {
          include: { criteria: true }
        },
        teacherReview: true,
        assignment: {
          include: { rubrics: { include: { criteria: true } } }
        }
      }
    });

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Get review detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email } }
    });

    if (!teacherProfile) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const resolvedParams = await props.params;
    const body = await req.json();
    
    const { finalScore, finalFeedback, publish } = body;

    if (typeof finalScore !== 'number') {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const review = await reviewService.saveReview(
      resolvedParams.id,
      teacherProfile.id,
      finalScore,
      finalFeedback || "",
      publish === true
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Save review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
