import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment, TeacherReview, SubmissionDocument } from "@/models/Submission";
import { Assignment, Rubric } from "@/models/Assignment";
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
    console.error("Get student review detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
