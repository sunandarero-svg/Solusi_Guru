/**
 * Seed script using native MongoDB driver (bypasses Prisma).
 * Prisma requires MongoDB replica set for transactions/nested writes,
 * but Railway MongoDB runs as standalone. This script uses the native
 * driver which works perfectly with standalone MongoDB.
 */
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  console.log("🌱 Seeding database (native MongoDB driver)...");

  const client = new MongoClient(DATABASE_URL!);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(); // uses database name from connection string

    // Collections
    const users = db.collection("User");
    const teacherProfiles = db.collection("TeacherProfile");
    const studentProfiles = db.collection("StudentProfile");
    const adminProfiles = db.collection("AdminProfile");
    const classes = db.collection("Class");
    const teacherClasses = db.collection("TeacherClass");
    const enrollments = db.collection("Enrollment");
    const assignments = db.collection("Assignment");
    const rubrics = db.collection("Rubric");
    const rubricCriteria = db.collection("RubricCriterion");

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 10);
    const now = new Date();

    // ─── Create Teacher ───
    let teacherUser = await users.findOne({ email: "guru@sekolah.com" });
    if (!teacherUser) {
      const result = await users.insertOne({
        email: "guru@sekolah.com",
        passwordHash: hashedPassword,
        role: "TEACHER",
        createdAt: now,
        updatedAt: now,
      });
      teacherUser = { _id: result.insertedId, email: "guru@sekolah.com" };
      console.log("✅ Teacher user created: guru@sekolah.com");
    } else {
      console.log("⏭️  Teacher already exists: guru@sekolah.com");
    }

    // Create TeacherProfile
    let teacherProfile = await teacherProfiles.findOne({ userId: teacherUser._id });
    if (!teacherProfile) {
      const result = await teacherProfiles.insertOne({
        userId: teacherUser._id,
        fullName: "Budi Santoso, S.Pd",
        maxStudents: 310,
        maxClasses: 10,
        deletedAt: null,
      });
      teacherProfile = { _id: result.insertedId };
      console.log("✅ Teacher profile created");
    } else {
      console.log("⏭️  Teacher profile already exists");
    }

    // ─── Create Admin ───
    let adminUser = await users.findOne({ email: "admin@sekolah.com" });
    if (!adminUser) {
      const adminHashedPassword = await bcrypt.hash("admin123", 10);
      const result = await users.insertOne({
        email: "admin@sekolah.com",
        passwordHash: adminHashedPassword,
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
      });
      adminUser = { _id: result.insertedId, email: "admin@sekolah.com" };
      console.log("✅ Admin user created: admin@sekolah.com");
    } else {
      console.log("⏭️  Admin already exists: admin@sekolah.com");
    }

    // Create AdminProfile
    let adminProfile = await adminProfiles.findOne({ userId: adminUser._id });
    if (!adminProfile) {
      await adminProfiles.insertOne({
        userId: adminUser._id,
        fullName: "Administrator Sistem",
      });
      console.log("✅ Admin profile created");
    } else {
      console.log("⏭️  Admin profile already exists");
    }

    // ─── Create Class ───
    let kelas = await classes.findOne({ name: "Kelas X IPA 1" });
    if (!kelas) {
      const result = await classes.insertOne({
        name: "Kelas X IPA 1",
        description: "Kelas X IPA 1 Tahun Ajaran 2025/2026",
      });
      kelas = { _id: result.insertedId, name: "Kelas X IPA 1" };
      console.log("✅ Class created: Kelas X IPA 1");
    } else {
      console.log("⏭️  Class already exists: Kelas X IPA 1");
    }

    // Link Teacher to Class
    const existingTC = await teacherClasses.findOne({
      teacherId: teacherProfile._id,
      classId: kelas._id,
    });
    if (!existingTC) {
      await teacherClasses.insertOne({
        teacherId: teacherProfile._id,
        classId: kelas._id,
      });
      console.log("✅ Teacher linked to class");
    } else {
      console.log("⏭️  Teacher already linked to class");
    }

    // ─── Create Students ───
    const studentsData = [
      { email: "siswa1@sekolah.com", fullName: "Andi Pratama", studentNumber: "2024001" },
      { email: "siswa2@sekolah.com", fullName: "Bela Safitri", studentNumber: "2024002" },
      { email: "siswa3@sekolah.com", fullName: "Candra Wijaya", studentNumber: "2024003" },
      { email: "siswa4@sekolah.com", fullName: "Dewi Rahayu", studentNumber: "2024004" },
      { email: "siswa5@sekolah.com", fullName: "Erik Gunawan", studentNumber: "2024005" },
    ];

    for (const s of studentsData) {
      let studentUser = await users.findOne({ email: s.email });
      if (!studentUser) {
        const result = await users.insertOne({
          email: s.email,
          passwordHash: hashedPassword,
          role: "STUDENT",
          createdAt: now,
          updatedAt: now,
        });
        studentUser = { _id: result.insertedId };
        console.log(`✅ Student created: ${s.fullName} (${s.email})`);
      } else {
        console.log(`⏭️  Student already exists: ${s.email}`);
      }

      // Create StudentProfile
      let studentProfile = await studentProfiles.findOne({ userId: studentUser._id });
      if (!studentProfile) {
        const result = await studentProfiles.insertOne({
          userId: studentUser._id,
          fullName: s.fullName,
          studentNumber: s.studentNumber,
        });
        studentProfile = { _id: result.insertedId };
      }

      // Enroll to class
      const existingEnrollment = await enrollments.findOne({
        studentId: studentProfile._id,
        classId: kelas._id,
      });
      if (!existingEnrollment) {
        await enrollments.insertOne({
          studentId: studentProfile._id,
          classId: kelas._id,
        });
      }
    }

    // ─── Create Assignment ───
    let assignment = await assignments.findOne({
      title: "Tugas Esai Biologi",
      teacherId: teacherProfile._id,
    });

    if (!assignment) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      const result = await assignments.insertOne({
        teacherId: teacherProfile._id,
        classId: kelas._id,
        title: "Tugas Esai Biologi",
        description: "Buatlah esai tentang sistem pernapasan manusia.",
        instructions: "Tulis dengan rapi di kertas folio bergaris, maksimal 2 halaman. Jangan lupa tulis nama dan kelas di pojok kanan atas.",
        deadline: deadline,
        maxPages: 2,
        status: "PUBLISHED",
        createdAt: now,
        updatedAt: now,
      });
      assignment = { _id: result.insertedId, title: "Tugas Esai Biologi" };
      console.log("✅ Assignment created: Tugas Esai Biologi");

      // Create Rubric
      const rubricResult = await rubrics.insertOne({
        assignmentId: assignment._id,
        title: "Rubrik Penilaian Esai Biologi",
        totalScore: 100,
      });
      console.log("✅ Rubric created");

      // Create Criteria
      const criteriaData = [
        { name: "Pemahaman Konsep", description: "Menjelaskan konsep sistem pernapasan dengan akurat.", maxScore: 40, order: 1 },
        { name: "Struktur & Alur", description: "Paragraf terstruktur dengan baik dan logis.", maxScore: 30, order: 2 },
        { name: "Kerapian Tulisan", description: "Tulisan tangan dapat dibaca dengan jelas.", maxScore: 20, order: 3 },
        { name: "Ejaan & Tata Bahasa", description: "Penggunaan tata bahasa yang baik dan benar.", maxScore: 10, order: 4 },
      ];

      for (const c of criteriaData) {
        await rubricCriteria.insertOne({
          rubricId: rubricResult.insertedId,
          ...c,
        });
      }
      console.log("✅ Rubric criteria created");
    } else {
      console.log("⏭️  Assignment already exists");
    }

    // ─── Create Indexes (match Prisma schema) ───
    try {
      console.log("⏳ Creating indexes...");
      await users.createIndex({ email: 1 }, { unique: true });
      await teacherProfiles.createIndex({ userId: 1 }, { unique: true });
      await adminProfiles.createIndex({ userId: 1 }, { unique: true });
      await studentProfiles.createIndex({ userId: 1 }, { unique: true });
      await studentProfiles.createIndex({ studentNumber: 1 }, { unique: true });
      await enrollments.createIndex({ studentId: 1, classId: 1 }, { unique: true });
      await teacherClasses.createIndex({ teacherId: 1, classId: 1 }, { unique: true });
      console.log("✅ Indexes created");
    } catch (indexError: any) {
      console.warn("⚠️  Could not create indexes (often due to low disk space on Railway free tier), but data was seeded successfully. Error:", indexError.message);
    }

    console.log("\n🎉 Seeding complete!");
    console.log("─────────────────────────────────────────");
    console.log("Login Admin  : admin@sekolah.com / admin123");
    console.log("Login Guru   : guru@sekolah.com / password123");
    console.log("Login Siswa  : siswa1@sekolah.com / password123");
    console.log("─────────────────────────────────────────");

  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
