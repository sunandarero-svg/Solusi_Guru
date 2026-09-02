import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { reviewService } from "@/modules/review/reviewService";
import dbConnect from "@/lib/mongoose";
import { Submission, AIAssessment, TeacherReview, AssessmentCriterion, SubmissionPage } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion } from "@/models/Assignment";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
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

    const submission = await Submission.findById(resolvedParams.id)
      .populate('studentId')
      .populate('assignmentId')
      .lean();

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [aiAssessment, teacherReview, assignment, rubrics, pages] = await Promise.all([
      AIAssessment.findOne({ submissionId: submission._id }).lean(),
      TeacherReview.findOne({ submissionId: submission._id }).lean(),
      Assignment.findById(submission.assignmentId).lean(),
      Rubric.find({ assignmentId: submission.assignmentId }).lean(),
      SubmissionPage.find({ submissionId: submission._id }).sort({ pageNumber: 1 }).lean()
    ]);

    const rubricsWithCriteria = await Promise.all(rubrics.map(async (r: any) => {
      const criteria = await RubricCriterion.find({ rubricId: r._id }).sort({ order: 1 }).lean();
      return { ...r, criteria };
    }));

    let aiCriteria: any[] = [];
    if (aiAssessment) {
      aiCriteria = await AssessmentCriterion.find({ assessmentId: aiAssessment._id }).lean();
    }

    const formattedSubmission = {
      ...submission,
      student: submission.studentId,
      aiAssessment: aiAssessment ? { ...aiAssessment, criteria: aiCriteria } : null,
      teacherReview,
      pages: pages || [],
      assignment: {
        ...assignment,
        rubrics: rubricsWithCriteria
      }
    };

    return NextResponse.json(mapId(formattedSubmission));
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

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    
    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const resolvedParams = await props.params;
    const body = await req.json();
    
    const { finalScore, finalFeedback, publish } = body;

    if (typeof finalScore !== 'number') {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const review = await reviewService.saveReview(
      resolvedParams.id,
      teacherProfile._id.toString(),
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
