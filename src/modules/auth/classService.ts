import { prisma } from "@/lib/prisma";

export async function getAllClasses() {
  return prisma.class.findMany({
    include: {
      enrollments: { include: { student: true } },
      teachers: { include: { teacher: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTeacherProfileByEmail(email: string) {
  return prisma.teacherProfile.findFirst({
    where: { user: { email } },
  });
}

