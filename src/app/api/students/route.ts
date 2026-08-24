import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { getAllStudents, createStudent, getStudentCount } from "@/modules/auth/studentService";
import { prisma } from "@/lib/prisma";

// GET: Ambil semua siswa
export async function GET() {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await getAllStudents();
  return NextResponse.json(students);
}

// POST: Tambah siswa baru
export async function POST(req: Request) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, password, fullName, studentNumber, classId } = body;

  if (!email || !password || !fullName || !studentNumber) {
    return NextResponse.json({ error: "Field tidak boleh kosong" }, { status: 400 });
  }

  // Check teacher student quota
  const teacherProfile = await prisma.teacherProfile.findFirst({
    where: { user: { email: session.user.email! } },
  });

  if (teacherProfile) {
    const currentStudentCount = await getStudentCount();
    if (currentStudentCount >= teacherProfile.maxStudents) {
      return NextResponse.json(
        { error: `Kuota siswa sudah penuh. Maksimal ${teacherProfile.maxStudents} siswa. Hubungi admin untuk menambah kuota.` },
        { status: 400 }
      );
    }
  }

  try {
    const user = await createStudent({ email, password, fullName, studentNumber, classId });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan siswa" },
      { status: 400 }
    );
  }
}

