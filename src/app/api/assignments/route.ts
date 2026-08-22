import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { assignmentService } from "@/modules/assignment/assignmentService";

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email } }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const assignments = await assignmentService.getAllAssignments(teacherProfile.id);
    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    
    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: session.user.email } }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, classId, description, instructions, deadline, maxPages } = body;

    if (!title || !classId) {
      return NextResponse.json({ error: "Title and Class are required" }, { status: 400 });
    }

    const assignment = await assignmentService.createAssignment({
      teacherId: teacherProfile.id,
      classId,
      title,
      description,
      instructions,
      deadline: deadline ? new Date(deadline) : undefined,
      maxPages: maxPages ? parseInt(maxPages) : undefined,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}
