import { NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import {
  getAllTeachers,
  createTeacher,
  getTeacherStudentCount,
} from "@/modules/admin/adminService";

// GET: List all teachers
export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teachers = await getAllTeachers();

  // Enrich with actual student counts
  const teachersWithCounts = await Promise.all(
    teachers.map(async (teacher) => {
      const studentCount = await getTeacherStudentCount(teacher.id);
      return {
        ...teacher,
        actualStudents: studentCount,
        actualClasses: teacher._count.classes,
      };
    })
  );

  return NextResponse.json(teachersWithCounts);
}

// POST: Create a new teacher
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, password, fullName, maxStudents, maxClasses } = body;

  if (!email || !password || !fullName) {
    return NextResponse.json(
      { error: "Email, password, dan nama lengkap harus diisi" },
      { status: 400 }
    );
  }

  try {
    const teacher = await createTeacher({
      email,
      password,
      fullName,
      maxStudents,
      maxClasses,
    });
    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan guru" },
      { status: 400 }
    );
  }
}

