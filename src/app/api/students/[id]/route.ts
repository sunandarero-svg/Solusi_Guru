import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { deleteStudent } from "@/modules/auth/studentService";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await props.params;
    await deleteStudent(resolvedParams.id);

    return NextResponse.json({ success: true, message: "Siswa berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE Student error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus siswa" },
      { status: 500 }
    );
  }
}
