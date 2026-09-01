import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { AdminProfile, TeacherProfile, StudentProfile } from "@/models/Profile";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // Cek apakah admin sudah ada
    const adminExists = await User.findOne({ email: "admin@admin.com" });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash("password", 10);

      // Create Admin
      const admin = await User.create({
        email: "admin@admin.com",
        passwordHash,
        role: Role.ADMIN,
      });
      await AdminProfile.create({
        userId: admin._id,
        fullName: "Super Admin",
      });

      // Create Teacher
      const guru = await User.create({
        email: "guru@guru.com",
        passwordHash,
        role: Role.TEACHER,
      });
      await TeacherProfile.create({
        userId: guru._id,
        fullName: "Bapak Guru",
      });

      // Create Student
      const siswa = await User.create({
        email: "siswa@siswa.com",
        passwordHash,
        role: Role.STUDENT,
      });
      await StudentProfile.create({
        userId: siswa._id,
        studentNumber: "12345678",
        fullName: "Siswa Teladan",
      });
    }

    // Cek apakah principal sudah ada
    const principalExists = await User.findOne({ email: "kepsek@kepsek.com" });
    if (!principalExists) {
      const passwordHash = await bcrypt.hash("password", 10);
      const kepsek = await User.create({
        email: "kepsek@kepsek.com",
        passwordHash,
        role: Role.PRINCIPAL,
      });
      // Menggunakan any atau dynamic import jika Model PrincipalProfile belum di-import
      const { PrincipalProfile } = await import("@/models/Profile");
      await PrincipalProfile.create({
        userId: kepsek._id,
        fullName: "Bapak Kepala Sekolah",
      });
    }

    return NextResponse.json({
      message: "Seeding successful",
      accounts: {
        admin: { email: "admin@admin.com", password: "password" },
        guru: { email: "guru@guru.com", password: "password" },
        siswa: { email: "siswa@siswa.com", password: "password" },
        kepsek: { email: "kepsek@kepsek.com", password: "password" },
      }
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

