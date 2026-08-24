import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import { getAllClasses, getTeacherProfileByEmail } from "@/modules/auth/classService";
import { prisma } from "@/lib/prisma";

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
    // Check teacher class quota
    const currentClassCount = await prisma.teacherClass.count({
      where: { teacherId: teacherProfile.id },
    });

    if (currentClassCount >= teacherProfile.maxClasses) {
      return NextResponse.json(
        { error: `Kuota kelas sudah penuh. Maksimal ${teacherProfile.maxClasses} kelas.` },
        { status: 400 }
      );
    }

    // Workaround for Prisma + MongoDB Standalone Transaction Issue:
    // Use createMany instead of create, and generate ObjectIds manually.
    // createMany bypasses the transaction engine in Prisma for MongoDB.
    const { ObjectId } = require('bson');
    const newClassId = new ObjectId().toHexString();

    await prisma.class.createMany({
      data: [{
        id: newClassId,
        name,
        description,
      }],
    });

    const newTeacherClassId = new ObjectId().toHexString();
    await prisma.teacherClass.createMany({
      data: [{
        id: newTeacherClassId,
        classId: newClassId,
        teacherId: teacherProfile.id,
      }],
    });

    const newClass = await prisma.class.findUnique({
      where: { id: newClassId }
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat kelas" },
      { status: 400 }
    );
  }
}
