import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const teacherProfile = await prisma.teacherProfile.findFirst();
    if (!teacherProfile) {
      console.log("No teacher profile found");
      return;
    }

    console.log("Creating class...");
    const newClass = await prisma.class.create({
      data: {
        name: "Test Class " + Date.now(),
        description: "Test description",
      },
    });
    console.log("Class created successfully:", newClass.id);

    console.log("Creating teacher class relation...");
    await prisma.teacherClass.create({
      data: {
        classId: newClass.id,
        teacherId: teacherProfile.id,
      },
    });
    console.log("Relation created successfully");

  } catch (e: any) {
    console.error("ERROR:");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
