import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { attachmentService } from "@/modules/attachment/attachmentService";
import { Assignment } from "@/models/Assignment";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized");

    const resolvedParams = await params;
    const { answerKey } = await req.json();

    await dbConnect();
    const user = await User.findOne({ email: session.user.email! }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    // Verify assignment ownership
    const assignment = await Assignment.findById(resolvedParams.id).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherProfile._id.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    // Save answer key
    await attachmentService.saveAnswerKey(resolvedParams.id, answerKey);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Update Answer Key Error]", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan kunci jawaban." },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
