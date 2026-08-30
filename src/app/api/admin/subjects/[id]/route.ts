import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Subject } from "@/models/Subject";
import { TeacherClass } from "@/models/Class";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    await dbConnect();
    
    // Check if subject is in use
    const inUse = await TeacherClass.findOne({ subjectId: resolvedParams.id });
    if (inUse) {
      return NextResponse.json({ error: "Mata pelajaran ini sedang ditugaskan kepada guru dan tidak dapat dihapus." }, { status: 400 });
    }

    await Subject.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
