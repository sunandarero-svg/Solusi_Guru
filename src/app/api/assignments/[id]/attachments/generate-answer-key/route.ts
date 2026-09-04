import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { attachmentService } from "@/modules/attachment/attachmentService";
import { Assignment, Rubric, RubricCriterion } from "@/models/Assignment";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import { GroqProvider } from "@/modules/ai/GroqProvider";

export async function POST(
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

    // Get combined extracted text from all attachments
    const combinedText = await attachmentService.getCombinedText(resolvedParams.id);
    if (!combinedText || combinedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Tidak ada teks yang bisa diekstrak dari lampiran. Pastikan lampiran berisi teks soal." },
        { status: 400 }
      );
    }

    // Get rubrics for context
    const rubrics = await Rubric.find({ assignmentId: resolvedParams.id }).lean();
    const rubricsWithCriteria = await Promise.all(rubrics.map(async (r) => {
      const criteria = await RubricCriterion.find({ rubricId: r._id }).sort({ order: 1 }).lean();
      return { ...r, criteria };
    }));

    // Get attachments with image files for visual analysis
    const attachments = await attachmentService.getAttachmentsByAssignment(resolvedParams.id);
    const imageAttachments = attachments.filter((a: any) => a.mimeType?.startsWith("image/"));

    // Generate answer key using AI
    const provider = new GroqProvider();
    const answerKey = await provider.generateAnswerKey(combinedText, rubricsWithCriteria, imageAttachments);

    // Save answer key
    await attachmentService.saveAnswerKey(resolvedParams.id, answerKey);

    return NextResponse.json({ answerKey });
  } catch (error: any) {
    console.error("[Generate Answer Key Error]", error);
    return NextResponse.json(
      { error: error.message || "Gagal generate kunci jawaban." },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
