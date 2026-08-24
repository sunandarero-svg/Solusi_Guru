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

export async function createClass(data: {
  name: string;
  description?: string;
  teacherProfileId: string;
}) {
  // Check teacher class quota
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { id: data.teacherProfileId },
  });

  if (teacherProfile) {
    const currentClassCount = await prisma.teacherClass.count({
      where: { teacherId: data.teacherProfileId },
    });

    if (currentClassCount >= teacherProfile.maxClasses) {
      throw new Error(
        `Kuota kelas sudah penuh. Maksimal ${teacherProfile.maxClasses} kelas. Hubungi admin untuk menambah kuota.`
      );
    }
  }

  // Split into sequential operations instead of nested create to avoid MongoDB transaction errors on standalone clusters
  const newClass = await prisma.class.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });

  await prisma.teacherClass.create({
    data: {
      classId: newClass.id,
      teacherId: data.teacherProfileId,
    },
  });

  return newClass;
}

export async function getTeacherProfileByEmail(email: string) {
  return prisma.teacherProfile.findFirst({
    where: { user: { email } },
  });
}

