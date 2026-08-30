import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
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
    
    await TeacherClass.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
