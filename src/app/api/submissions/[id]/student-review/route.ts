import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment, TeacherReview, SubmissionDocument, AssessmentCriterion } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion } from "@/models/Assignment";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const submission = await Submission.findById(resolvedParams.id)
      .populate('assignmentId')
      .lean();

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Ensure the submission belongs to the student
    if (submission.studentId.toString() !== studentProfile._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { SubmissionPage } = require("@/models/Submission");
    const [ocrResults, aiAssessment, teacherReview, assignment, rubrics, document, pages] = await Promise.all([
      OCRResult.find({ submissionId: submission._id }).sort({ processedAt: -1 }).limit(1).lean(),
      AIAssessment.findOne({ submissionId: submission._id }).lean(),
      TeacherReview.findOne({ submissionId: submission._id }).lean(),
      Assignment.findById(submission.assignmentId).lean(),
      Rubric.find({ assignmentId: submission.assignmentId }).lean(),
      SubmissionDocument.findOne({ submissionId: submission._id }).lean(),
      SubmissionPage.find({ submissionId: submission._id }).sort({ pageNumber: 1 }).lean()
    ]);

    let aiAssessmentCriteria: any[] = [];
    if (aiAssessment) {
      aiAssessmentCriteria = await AssessmentCriterion.find({ assessmentId: aiAssessment._id }).lean();
      (aiAssessment as any).criteria = aiAssessmentCriteria;
    }

    let rubricCriteria: any[] = [];
    if (rubrics && rubrics.length > 0) {
      const rubricIds = rubrics.map(r => (r as any)._id);
      rubricCriteria = await RubricCriterion.find({ rubricId: { $in: rubricIds } }).lean();
    }
    
    const rubricsWithCriteria = rubrics.map(r => ({
      ...r,
      criteria: rubricCriteria.filter(c => (c as any).rubricId.toString() === (r as any)._id.toString())
    }));

    const formattedSubmission = {
      ...submission,
      ocrResults,
      aiAssessment,
      teacherReview,
      document,
      pages,
      assignment: {
        ...assignment,
        rubrics: rubricsWithCriteria
      }
    };

    return NextResponse.json(formattedSubmission);
  } catch (error) {
    console.error("Get student review detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
