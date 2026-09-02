import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Enrollment } from "@/models/Class";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    // Remove the enrollment
    const result = await Enrollment.findOneAndDelete({
      classId: resolvedParams.id,
      studentId: resolvedParams.studentId
    });

    if (!result) {
      return NextResponse.json({ error: "Student not found in this class" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Siswa berhasil dihapus dari kelas" });
  } catch (error: any) {
    console.error("DELETE Class student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
