import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { rubricService } from "@/modules/rubric/rubricService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) throw new Error("Unauthorized");

    const resolvedParams = await params;
    const rubric = await rubricService.getRubricByAssignmentId(resolvedParams.id);
    return NextResponse.json(rubric || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
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

    const body = await req.json();
    const { title, criteria } = body;

    if (!title || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid rubric data" }, { status: 400 });
    }

    const rubric = await rubricService.upsertRubric(resolvedParams.id, teacherProfile.id, {
      title,
      criteria,
    });

    return NextResponse.json(rubric);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 400 });
  }
}
