import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, AIAssessment, TeacherReview, StudentAnswerAnalysis } from "@/models/Submission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, analysisId: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json();
    const { score, analysis } = body;

    if (typeof score !== 'number' || typeof analysis !== 'string') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await dbConnect();

    // 1. Update the specific analysis
    const updatedAnalysis = await StudentAnswerAnalysis.findByIdAndUpdate(
      resolvedParams.analysisId,
      {
        $set: {
          score,
          analysis,
          status: "MANUAL_EDIT"
        }
      },
      { new: true }
    );

    if (!updatedAnalysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // 2. Recalculate total score
    const allAnalyses = await StudentAnswerAnalysis.find({ assessmentId: updatedAnalysis.assessmentId });
    let newTotalScore = allAnalyses.reduce((acc, curr) => acc + (curr.score || 0), 0);
    if (newTotalScore > 100) newTotalScore = 100;

    // 3. Update AIAssessment
    await AIAssessment.findByIdAndUpdate(
      updatedAnalysis.assessmentId,
      { $set: { suggestedScore: newTotalScore } }
    );

    // 4. Update TeacherReview if it exists (so student sees the updated score)
    await TeacherReview.findOneAndUpdate(
      { submissionId: resolvedParams.id },
      { $set: { finalScore: newTotalScore } }
    );

    return NextResponse.json({ success: true, newTotalScore, updatedAnalysis });
  } catch (error: any) {
    console.error("Manual edit analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
