import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentQuestion } from "@/models/Assignment";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized");

    const resolvedParams = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email! }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Verify assignment ownership
    const assignment = await Assignment.findById(resolvedParams.id).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherProfile._id.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    const questions = await AssignmentQuestion.find({ assignmentId: resolvedParams.id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignment questions" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized");

    const resolvedParams = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email! }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Verify assignment ownership
    const assignment = await Assignment.findById(resolvedParams.id).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherProfile._id.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    const body = await req.json();
    const { questions } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions must be an array" }, { status: 400 });
    }

    // Delete existing questions
    await AssignmentQuestion.deleteMany({ assignmentId: resolvedParams.id });

    // Insert new questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: any) => ({
        assignmentId: resolvedParams.id,
        order: q.order,
        questionType: q.questionType,
        maxScore: q.maxScore
      }));
      await AssignmentQuestion.insertMany(questionsToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update assignment questions" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
