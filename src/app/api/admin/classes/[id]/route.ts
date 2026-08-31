import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class, TeacherClass, Enrollment } from "@/models/Class";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await dbConnect();
    
    // Check if class exists
    const existing = await Class.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    // Delete associations
    await TeacherClass.deleteMany({ classId: id });
    await Enrollment.deleteMany({ classId: id });

    await Class.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Kelas berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
