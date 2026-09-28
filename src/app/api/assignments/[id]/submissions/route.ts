import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, AIAssessment, TeacherReview } from "@/models/Submission";
import { Assignment } from "@/models/Assignment";
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

    const assignment = await Assignment.findById(resolvedParams.id).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Fetch all enrollments for this class
    const { Enrollment } = await import("@/models/Class");
    const { StudentProfile } = await import("@/models/Profile");
    
    // We need to register StudentProfile model if it isn't registered, 
    // but importing it should register it.
    const enrollments = await Enrollment.find({ classId: assignment.classId })
      .populate('studentId')
      .lean();

    const submissions = await Submission.find({ assignmentId: resolvedParams.id })
      .lean();

    const submissionIds = submissions.map((s: any) => s._id);
    const [aiAssessments, teacherReviews] = await Promise.all([
      AIAssessment.find({ submissionId: { $in: submissionIds } }).lean(),
      TeacherReview.find({ submissionId: { $in: submissionIds } }).lean()
    ]);

    const assessmentIds = aiAssessments.map((a: any) => a._id);
    const { StudentAnswerAnalysis } = await import("@/models/Submission");
    const allAnalyses = await StudentAnswerAnalysis.find({ assessmentId: { $in: assessmentIds } }).lean();

    const formattedSubmissions = enrollments.map((enrollment: any) => {
      const student = enrollment.studentId;
      if (!student) return null; // Skip if student profile is somehow missing
      
      const sub = submissions.find((s: any) => s.studentId.toString() === student._id.toString());
      
      if (sub) {
        const aiAssessmentForSub = aiAssessments.find((a: any) => a.submissionId.toString() === sub._id.toString());
        const hasAppeal = aiAssessmentForSub ? allAnalyses.some((an: any) => an.assessmentId.toString() === aiAssessmentForSub._id.toString() && an.appealStatus === "PENDING") : false;

        return {
          ...sub,
          student: student,
          hasChangedAnswer: sub.hasChangedAnswer,
          hasAppeal: hasAppeal,
          aiAssessment: aiAssessmentForSub,
          teacherReview: teacherReviews.find((r: any) => r.submissionId.toString() === sub._id.toString()),
        };
      } else {
        // Return dummy submission for students who haven't submitted
        return {
          id: `unsubmitted-${student._id}`,
          _id: `unsubmitted-${student._id}`,
          student: student,
          status: "UNSUBMITTED",
          updatedAt: new Date().toISOString()
        };
      }
    }).filter(Boolean);

    // Sort by name or submission status
    formattedSubmissions.sort((a, b) => {
      if (a.student.fullName < b.student.fullName) return -1;
      if (a.student.fullName > b.student.fullName) return 1;
      return 0;
    });

    return NextResponse.json(mapId(formattedSubmissions));
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
