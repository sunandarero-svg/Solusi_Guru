import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: "guru@sekolah.com" },
    update: {},
    create: {
      email: "guru@sekolah.com",
      passwordHash: hashedPassword,
      role: "TEACHER",
      teacherProfile: {
        create: {
          fullName: "Budi Santoso, S.Pd",
        },
      },
    },
    include: { teacherProfile: true },
  });
  console.log(`✅ Teacher created: ${teacherUser.email}`);

  // Create Class
  const kelas = await prisma.class.upsert({
    where: { id: "class-kelas-x-ipa-1" },
    update: {},
    create: {
      id: "class-kelas-x-ipa-1",
      name: "Kelas X IPA 1",
      description: "Kelas X IPA 1 Tahun Ajaran 2025/2026",
    },
  });
  console.log(`✅ Class created: ${kelas.name}`);

  // Link Teacher to Class
  if (teacherUser.teacherProfile) {
    await prisma.teacherClass.upsert({
      where: { id: "teacher-class-1" },
      update: {},
      create: {
        id: "teacher-class-1",
        teacherId: teacherUser.teacherProfile.id,
        classId: kelas.id,
      },
    });
    console.log(`✅ Teacher linked to class`);
  }

  // Create 5 Students
  const students = [
    { email: "siswa1@sekolah.com", fullName: "Andi Pratama", studentNumber: "2024001" },
    { email: "siswa2@sekolah.com", fullName: "Bela Safitri", studentNumber: "2024002" },
    { email: "siswa3@sekolah.com", fullName: "Candra Wijaya", studentNumber: "2024003" },
    { email: "siswa4@sekolah.com", fullName: "Dewi Rahayu", studentNumber: "2024004" },
    { email: "siswa5@sekolah.com", fullName: "Erik Gunawan", studentNumber: "2024005" },
  ];

  for (const s of students) {
    const studentUser = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          create: {
            fullName: s.fullName,
            studentNumber: s.studentNumber,
          },
        },
      },
      include: { studentProfile: true },
    });

    // Enroll student to class
    if (studentUser.studentProfile) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: studentUser.studentProfile.id,
          classId: kelas.id,
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            studentId: studentUser.studentProfile.id,
            classId: kelas.id,
          },
        });
      }
    }
    console.log(`✅ Student created: ${s.fullName} (${s.email})`);
  }

  // Create Assignment
  if (teacherUser.teacherProfile) {
    const assignment = await prisma.assignment.upsert({
      where: { id: "assignment-1" },
      update: {},
      create: {
        id: "assignment-1",
        title: "Tugas Esai Biologi",
        description: "Buatlah esai tentang sistem pernapasan manusia.",
        instructions: "Tulis dengan rapi di kertas folio bergaris, maksimal 2 halaman. Jangan lupa tulis nama dan kelas di pojok kanan atas.",
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
        maxPages: 2,
        status: "PUBLISHED",
        teacherId: teacherUser.teacherProfile.id,
        classId: kelas.id,
      },
    });
    console.log(`✅ Assignment created: ${assignment.title}`);

    // Create Rubric for the assignment
    await prisma.rubric.upsert({
      where: { id: "rubric-1" },
      update: {},
      create: {
        id: "rubric-1",
        title: "Rubrik Penilaian Esai Biologi",
        totalScore: 100,
        assignmentId: assignment.id,
        criteria: {
          create: [
            {
              name: "Pemahaman Konsep",
              description: "Menjelaskan konsep sistem pernapasan dengan akurat.",
              maxScore: 40,
              order: 1,
            },
            {
              name: "Struktur & Alur",
              description: "Paragraf terstruktur dengan baik dan logis.",
              maxScore: 30,
              order: 2,
            },
            {
              name: "Kerapian Tulisan",
              description: "Tulisan tangan dapat dibaca dengan jelas.",
              maxScore: 20,
              order: 3,
            },
            {
              name: "Ejaan & Tata Bahasa",
              description: "Penggunaan tata bahasa yang baik dan benar.",
              maxScore: 10,
              order: 4,
            },
          ]
        }
      },
    });
    console.log(`✅ Rubric created for assignment`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("Login Guru   : guru@sekolah.com / password123");
  console.log("Login Siswa  : siswa1@sekolah.com / password123");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
