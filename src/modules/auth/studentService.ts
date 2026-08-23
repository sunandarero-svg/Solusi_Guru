import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getAllStudents() {
  return prisma.studentProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
      enrollments: { include: { class: true } },
    },
    orderBy: { studentNumber: "asc" },
  });
}

export async function createStudent(data: {
  email: string;
  password: string;
  fullName: string;
  studentNumber: string;
  classId?: string;
}) {
  // Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user first (no nested create to avoid transaction requirement)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      role: "STUDENT",
    },
  });

  // Create student profile separately
  const studentProfile = await prisma.studentProfile.create({
    data: {
      userId: user.id,
      fullName: data.fullName,
      studentNumber: data.studentNumber,
    },
  });

  // Enroll to class if classId provided
  if (data.classId) {
    await prisma.enrollment.create({
      data: {
        studentId: studentProfile.id,
        classId: data.classId,
      },
    });
  }

  return { ...user, studentProfile };
}

export async function getStudentCount() {
  return prisma.studentProfile.count();
}
