import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { rubricService } from "@/modules/rubric/rubricService";
import { prisma } from "@/lib/prisma";

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
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email! } }
    });

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
