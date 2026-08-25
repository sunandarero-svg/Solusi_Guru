import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { getAllClasses, getTeacherProfileByEmail } from "@/modules/auth/classService";
import dbConnect from "@/lib/mongoose";
import { Class, TeacherClass } from "@/models/Class";

// GET: Ambil semua kelas
export async function GET() {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classes = await getAllClasses();
  return NextResponse.json(classes);
}

// POST: Buat kelas baru
export async function POST(req: Request) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Nama kelas tidak boleh kosong" }, { status: 400 });
  }

  const teacherProfile = await getTeacherProfileByEmail(session.user.email!);
  if (!teacherProfile) {
    return NextResponse.json({ error: "Profil guru tidak ditemukan" }, { status: 404 });
  }

  try {
    await dbConnect();
    // Check teacher class quota
    const currentClassCount = await TeacherClass.countDocuments({
      teacherId: teacherProfile.id,
    });

    if (currentClassCount >= teacherProfile.maxClasses) {
      return NextResponse.json(
        { error: `Kuota kelas sudah penuh. Maksimal ${teacherProfile.maxClasses} kelas.` },
        { status: 400 }
      );
    }

    const newClass = await Class.create({
      name,
      description,
    });

    await TeacherClass.create({
      classId: newClass._id,
      teacherId: teacherProfile.id,
    });

    return NextResponse.json(newClass.toObject(), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat kelas" },
      { status: 400 }
    );
  }
}
