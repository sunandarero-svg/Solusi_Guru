import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import { assignmentService } from "@/modules/assignment/assignmentService";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

// GET can be accessed by teacher or student
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) throw new Error("Unauthorized");

    const resolvedParams = await params;
    const assignment = await assignmentService.getAssignmentById(resolvedParams.id);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // TODO: In a production app, we should verify that the student belongs to the class
    // For now, if logged in, they can see it.

    return NextResponse.json(assignment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

// PUT / PATCH only for teachers
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized");

    const resolvedParams = await params;
    const body = await req.json();
    const { title, description, instructions, deadline, maxPages, status } = body;

    await dbConnect();
    const user = await User.findOne({ email: session.user.email! }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const updated = await assignmentService.updateAssignment(resolvedParams.id, teacherProfile._id.toString(), {
      title,
      description,
      instructions,
      deadline: deadline ? new Date(deadline) : undefined,
      maxPages: maxPages ? parseInt(maxPages) : undefined,
      status
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}
