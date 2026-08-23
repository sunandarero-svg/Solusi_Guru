import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Teacher
  let teacherUser = await prisma.user.findUnique({
    where: { email: "guru@sekolah.com" },
    include: { teacherProfile: true },
  });

  if (!teacherUser) {
    teacherUser = await prisma.user.create({
      data: {
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
  } else {
    console.log(`⏭️  Teacher already exists: ${teacherUser.email}`);
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
  if (teacherUser.teacherProfile) {
    const existingTeacherClass = await prisma.teacherClass.findFirst({
      where: {
        teacherId: teacherUser.teacherProfile.id,
        classId: kelas.id,
      },
    });

    if (!existingTeacherClass) {
      await prisma.teacherClass.create({
        data: {
          teacherId: teacherUser.teacherProfile.id,
          classId: kelas.id,
        },
      });
      console.log(`✅ Teacher linked to class`);
    } else {
      console.log(`⏭️  Teacher already linked to class`);
    }
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
    let studentUser = await prisma.user.findUnique({
      where: { email: s.email },
      include: { studentProfile: true },
    });

    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
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
      console.log(`✅ Student created: ${s.fullName} (${s.email})`);
    } else {
      console.log(`⏭️  Student already exists: ${s.fullName} (${s.email})`);
    }

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
  }

  // Create Assignment
  if (teacherUser.teacherProfile) {
    let assignment = await prisma.assignment.findFirst({
      where: {
        title: "Tugas Esai Biologi",
        teacherId: teacherUser.teacherProfile.id,
      },
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
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
      await prisma.rubric.create({
        data: {
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
    } else {
      console.log(`⏭️  Assignment already exists: ${assignment.title}`);
    }
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
