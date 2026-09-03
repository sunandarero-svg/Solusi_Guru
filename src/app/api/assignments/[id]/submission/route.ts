import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();

    if (!studentProfile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const resolvedParams = await props.params;
    
    // Check if student has submission
    const submission = await submissionService.getSubmissionByAssignmentAndStudent(
      resolvedParams.id, 
      studentProfile._id.toString()
    );

    if (submission) {
      const { AIAssessment, TeacherReview, AssessmentCriterion } = require("@/models/Submission");
      const { mapId } = require("@/lib/mapId");
      let aiAssessment = await AIAssessment.findOne({ submissionId: submission.id }).lean();
      const teacherReview = await TeacherReview.findOne({ submissionId: submission.id }).lean();
      
      if (aiAssessment) {
        const criteria = await AssessmentCriterion.find({ assessmentId: aiAssessment._id }).lean();
        aiAssessment.criteria = criteria;
      }
      
      return NextResponse.json(mapId({ ...submission, aiAssessment, teacherReview }));
    }

    return NextResponse.json(null);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
