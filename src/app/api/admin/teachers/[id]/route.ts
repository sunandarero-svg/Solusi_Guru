import { NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import {
  deleteTeacher,
  updateTeacherQuota,
  getTeacherById,
} from "@/modules/admin/adminService";

// DELETE: Soft-delete a teacher
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteTeacher(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal menghapus guru" },
      { status: 400 }
    );
  }
}

// PATCH: Update teacher quota
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { maxStudents, maxClasses } = body;

  if (maxStudents !== undefined && (typeof maxStudents !== "number" || maxStudents < 1)) {
    return NextResponse.json(
      { error: "maxStudents harus berupa angka positif" },
      { status: 400 }
    );
  }

  if (maxClasses !== undefined && (typeof maxClasses !== "number" || maxClasses < 1)) {
    return NextResponse.json(
      { error: "maxClasses harus berupa angka positif" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateTeacherQuota(id, { maxStudents, maxClasses });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengupdate kuota" },
      { status: 400 }
    );
  }
}

// GET: Get single teacher detail
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const teacher = await getTeacherById(id);
    if (!teacher) {
      return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(teacher);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data guru" },
      { status: 400 }
    );
  }
}
