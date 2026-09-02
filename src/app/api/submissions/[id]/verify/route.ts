import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import { verifyPageReadability } from "@/modules/ai/verifyHelper";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await props.params;

    // Check if submission belongs to student
    const submission = await submissionService.getSubmissionById(resolvedParams.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (!submission.pages || submission.pages.length === 0) {
      return NextResponse.json({ error: "No pages found for verification" }, { status: 400 });
    }

    try {
      const parsed = await verifyPageReadability(submission.pages);

      if (parsed.feasible === false || parsed.readabilityScore < 80) {
        return NextResponse.json(
          {
            error: "AI_REJECTION",
            score: parsed.readabilityScore,
            reason: parsed.reason,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        aiResult: parsed,
      });
    } catch (aiError: any) {
      console.error("AI Verify check error:", aiError);
      return NextResponse.json(
        { error: `Gagal memverifikasi kelayakan foto dengan AI: ${aiError?.message || aiError}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Verify pages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
