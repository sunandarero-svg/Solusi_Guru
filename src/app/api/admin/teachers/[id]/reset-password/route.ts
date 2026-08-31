import { NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import { resetTeacherPassword } from "@/modules/admin/adminService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await resetTeacherPassword(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mereset password" },
      { status: 400 }
    );
  }
}
