import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    const { analysisId, reason } = await req.json();

    if (!analysisId || !reason) {
      return NextResponse.json({ error: "Missing analysisId or reason" }, { status: 400 });
    }

    await dbConnect();
    const { StudentAnswerAnalysis } = require("@/models/Submission");

    await StudentAnswerAnalysis.findByIdAndUpdate(analysisId, {
      appealStatus: "PENDING",
      appealReason: reason
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appeal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
