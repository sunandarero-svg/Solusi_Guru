import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { reviewService } from "@/modules/review/reviewService";
import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment, TeacherReview, SubmissionDocument } from "@/models/Submission";
import { Assignment, Rubric } from "@/models/Assignment";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

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

    // Fetch related docs manually since MongoDB doesn't do deep joins automatically the same way Prisma did.
    // However, our API needs matching format.
    const [ocrResults, aiAssessment, teacherReview, assignment, rubrics, document] = await Promise.all([
      OCRResult.find({ submissionId: submission._id }).sort({ processedAt: -1 }).limit(1).lean(),
      AIAssessment.findOne({ submissionId: submission._id }).populate('criteria').lean(),
      TeacherReview.findOne({ submissionId: submission._id }).lean(),
      Assignment.findById(submission.assignmentId).lean(),
      Rubric.find({ assignmentId: submission.assignmentId }).populate('criteria').lean(),
      SubmissionDocument.findOne({ submissionId: submission._id }).lean()
    ]);

    const formattedSubmission = {
      ...submission,
      student: submission.studentId, // If you populated studentId, it holds the User object. But normally student is mapped to studentProfile. Let's keep it simple.
      ocrResults,
      aiAssessment,
      teacherReview,
      document,
      assignment: {
        ...assignment,
        rubrics
      }
    };

    return NextResponse.json(formattedSubmission);
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
