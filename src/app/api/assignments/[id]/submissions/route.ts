import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, AIAssessment, TeacherReview } from "@/models/Submission";
import { mapId } from "@/lib/mapId";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    // The frontend expects student, aiAssessment, and teacherReview included
    // In mongoose, we could use populate if they were refs on submission, but aiAssessment/teacherReview
    // are often queried with submissionId.
    // Actually, in our Mongoose setup, aiAssessment and teacherReview don't have refs FROM Submission.
    // So we need an aggregation or parallel find.
    // Since this is an API route, let's keep it simple.

    const submissions = await Submission.find({ assignmentId: resolvedParams.id })
      .populate('studentId')
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch related manually
    const submissionIds = submissions.map(s => s._id);
    const [aiAssessments, teacherReviews] = await Promise.all([
      AIAssessment.find({ submissionId: { $in: submissionIds } }).lean(),
      TeacherReview.find({ submissionId: { $in: submissionIds } }).lean()
    ]);

    const formattedSubmissions = submissions.map(sub => {
      return {
        ...sub,
        student: sub.studentId, // Note: Prisma returned student profile. Here we populate student user. May need adjustment if frontend expects profile.
        aiAssessment: aiAssessments.find(a => a.submissionId.toString() === sub._id.toString()),
        teacherReview: teacherReviews.find(r => r.submissionId.toString() === sub._id.toString()),
      };
    });

    return NextResponse.json(mapId(formattedSubmissions));
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
