import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Teacher (split into separate calls to avoid transaction)
  let teacherUser = await prisma.user.findUnique({
    where: { email: "guru@sekolah.com" },
  });

  if (!teacherUser) {
    teacherUser = await prisma.user.create({
      data: {
        email: "guru@sekolah.com",
        passwordHash: hashedPassword,
        role: "TEACHER",
      },
    });
    console.log(`✅ Teacher user created: ${teacherUser.email}`);
  } else {
    console.log(`⏭️  Teacher user already exists: ${teacherUser.email}`);
  }

  // Create TeacherProfile separately (no nested create = no transaction)
  let teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacherUser.id },
  });

  if (!teacherProfile) {
    teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        fullName: "Budi Santoso, S.Pd",
      },
    });
    console.log(`✅ Teacher profile created`);
  } else {
    console.log(`⏭️  Teacher profile already exists`);
  }

  // Create Class
  let kelas = await prisma.class.findFirst({
    where: { name: "Kelas X IPA 1" },
  });

  if (!kelas) {
    kelas = await prisma.class.create({
      data: {
        name: "Kelas X IPA 1",
        description: "Kelas X IPA 1 Tahun Ajaran 2025/2026",
      },
    });
    console.log(`✅ Class created: ${kelas.name}`);
  } else {
    console.log(`⏭️  Class already exists: ${kelas.name}`);
  }

  // Link Teacher to Class
  const existingTeacherClass = await prisma.teacherClass.findFirst({
    where: {
      teacherId: teacherProfile.id,
      classId: kelas.id,
    },
  });

  if (!existingTeacherClass) {
    await prisma.teacherClass.create({
      data: {
        teacherId: teacherProfile.id,
        classId: kelas.id,
      },
    });
    console.log(`✅ Teacher linked to class`);
  } else {
    console.log(`⏭️  Teacher already linked to class`);
  }

  // Create 5 Students (each split into User + Profile separately)
  const students = [
    { email: "siswa1@sekolah.com", fullName: "Andi Pratama", studentNumber: "2024001" },
    { email: "siswa2@sekolah.com", fullName: "Bela Safitri", studentNumber: "2024002" },
    { email: "siswa3@sekolah.com", fullName: "Candra Wijaya", studentNumber: "2024003" },
    { email: "siswa4@sekolah.com", fullName: "Dewi Rahayu", studentNumber: "2024004" },
    { email: "siswa5@sekolah.com", fullName: "Erik Gunawan", studentNumber: "2024005" },
  ];

  for (const s of students) {
    let studentUser = await prisma.user.findUnique({
      where: { email: s.email },
    });

    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: hashedPassword,
          role: "STUDENT",
        },
      });
      console.log(`✅ Student user created: ${s.email}`);
    } else {
      console.log(`⏭️  Student user already exists: ${s.email}`);
    }

    // Create StudentProfile separately
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentUser.id },
    });

    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: studentUser.id,
          fullName: s.fullName,
          studentNumber: s.studentNumber,
        },
      });
      console.log(`✅ Student profile created: ${s.fullName}`);
    }

    // Enroll student to class
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        classId: kelas.id,
      },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: studentProfile.id,
          classId: kelas.id,
        },
      });
    }
  }

  // Create Assignment
  let assignment = await prisma.assignment.findFirst({
    where: {
      title: "Tugas Esai Biologi",
      teacherId: teacherProfile.id,
    },
  });

  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        title: "Tugas Esai Biologi",
        description: "Buatlah esai tentang sistem pernapasan manusia.",
        instructions: "Tulis dengan rapi di kertas folio bergaris, maksimal 2 halaman. Jangan lupa tulis nama dan kelas di pojok kanan atas.",
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
        maxPages: 2,
        status: "PUBLISHED",
        teacherId: teacherProfile.id,
        classId: kelas.id,
      },
    });
    console.log(`✅ Assignment created: ${assignment.title}`);

    // Create Rubric (without nested criteria)
    const rubric = await prisma.rubric.create({
      data: {
        title: "Rubrik Penilaian Esai Biologi",
        totalScore: 100,
        assignmentId: assignment.id,
      },
    });

    // Create criteria one by one (no nested create = no transaction)
    const criteriaData = [
      { name: "Pemahaman Konsep", description: "Menjelaskan konsep sistem pernapasan dengan akurat.", maxScore: 40, order: 1 },
      { name: "Struktur & Alur", description: "Paragraf terstruktur dengan baik dan logis.", maxScore: 30, order: 2 },
      { name: "Kerapian Tulisan", description: "Tulisan tangan dapat dibaca dengan jelas.", maxScore: 20, order: 3 },
      { name: "Ejaan & Tata Bahasa", description: "Penggunaan tata bahasa yang baik dan benar.", maxScore: 10, order: 4 },
    ];

    for (const c of criteriaData) {
      await prisma.rubricCriterion.create({
        data: {
          rubricId: rubric.id,
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
          order: c.order,
        },
      });
    }
    console.log(`✅ Rubric + criteria created`);
  } else {
    console.log(`⏭️  Assignment already exists: ${assignment.title}`);
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
