import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Get all teachers (excluding soft-deleted)
 */
export async function getAllTeachers() {
  return prisma.teacherProfile.findMany({
    where: { deletedAt: null },
    include: {
      user: { select: { email: true, createdAt: true } },
      classes: { include: { class: true } },
      _count: {
        select: {
          classes: true,
          assignments: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  });
}

/**
 * Get teacher by ID (excluding soft-deleted)
 */
export async function getTeacherById(teacherProfileId: string) {
  return prisma.teacherProfile.findFirst({
    where: { id: teacherProfileId, deletedAt: null },
    include: {
      user: { select: { email: true } },
    },
  });
}

/**
 * Create a new teacher user + profile
 */
export async function createTeacher(data: {
  email: string;
  password: string;
  fullName: string;
  maxStudents?: number;
  maxClasses?: number;
}) {
  // Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user first (no nested create to avoid transaction requirement on standalone MongoDB)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      role: "TEACHER",
    },
  });

  // Create teacher profile separately
  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: user.id,
      fullName: data.fullName,
      maxStudents: data.maxStudents ?? 310,
      maxClasses: data.maxClasses ?? 10,
    },
  });

  return { ...user, teacherProfile };
}

/**
 * Soft-delete a teacher (set deletedAt timestamp)
 */
export async function deleteTeacher(teacherProfileId: string) {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherProfileId },
    include: { user: true },
  });

  if (!teacher) {
    throw new Error("Guru tidak ditemukan");
  }

  if (teacher.deletedAt) {
    throw new Error("Guru sudah dihapus sebelumnya");
  }

  // Soft-delete: set deletedAt timestamp
  await prisma.teacherProfile.update({
    where: { id: teacherProfileId },
    data: { deletedAt: new Date() },
  });

  return { success: true, message: "Guru berhasil dihapus (soft-delete)" };
}

/**
 * Update teacher quota (maxStudents, maxClasses)
 */
export async function updateTeacherQuota(
  teacherProfileId: string,
  data: { maxStudents?: number; maxClasses?: number }
) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { id: teacherProfileId, deletedAt: null },
  });

  if (!teacher) {
    throw new Error("Guru tidak ditemukan");
  }

  return prisma.teacherProfile.update({
    where: { id: teacherProfileId },
    data: {
      maxStudents: data.maxStudents ?? teacher.maxStudents,
      maxClasses: data.maxClasses ?? teacher.maxClasses,
    },
  });
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
  const [teacherCount, studentCount, classCount, assignmentCount] =
    await Promise.all([
      prisma.teacherProfile.count({ where: { deletedAt: null } }),
      prisma.studentProfile.count(),
      prisma.class.count(),
      prisma.assignment.count(),
    ]);

  return {
    teachers: teacherCount,
    students: studentCount,
    classes: classCount,
    assignments: assignmentCount,
  };
}

/**
 * Count students assigned to a teacher (through classes)
 */
export async function getTeacherStudentCount(teacherProfileId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      class: {
        teachers: {
          some: { teacherId: teacherProfileId },
        },
      },
    },
    select: { studentId: true },
  });

  // Count unique students
  const uniqueStudentIds = new Set(enrollments.map((e) => e.studentId));
  return uniqueStudentIds.size;
}
