import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userEmail = session?.user?.email;

  let stats = { assignments: 0, submissions: 0, students: 0 };

  if (role === "TEACHER") {
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { user: { email: userEmail ?? "" } },
    });

    if (teacherProfile) {
      const [assignmentCount, submissionCount, studentCount] = await Promise.all([
        prisma.assignment.count({
          where: { teacherId: teacherProfile.id },
        }),
        prisma.submission.count({
          where: {
            assignment: { teacherId: teacherProfile.id },
            status: "NEEDS_TEACHER_REVIEW",
          },
        }),
        prisma.studentProfile.count(),
      ]);

      stats = {
        assignments: assignmentCount,
        submissions: submissionCount,
        students: studentCount,
      };
    }
  }

  let studentStats = { activeAssignments: 0, mySubmissions: 0 };

  if (role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { user: { email: userEmail ?? "" } },
      include: { enrollments: true },
    });

    if (studentProfile) {
      const classIds = studentProfile.enrollments.map(e => e.classId);

      const [activeAssignmentCount, submissionCount] = await Promise.all([
        prisma.assignment.count({
          where: {
            classId: { in: classIds },
            status: "PUBLISHED",
          },
        }),
        prisma.submission.count({
          where: { studentId: studentProfile.id },
        }),
      ]);

      studentStats = {
        activeAssignments: activeAssignmentCount,
        mySubmissions: submissionCount,
      };
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Selamat Datang 👋
      </h1>
      <p className="text-gray-500 mb-8">
        Anda masuk sebagai <span className="font-semibold text-blue-600">{role === "TEACHER" ? "Guru" : "Siswa"}</span>
      </p>

      {role === "TEACHER" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">📋 Tugas</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.assignments}</p>
            <p className="text-sm text-gray-400 mt-1">Total tugas dibuat</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">📥 Submisi</h2>
            <p className="text-3xl font-bold text-orange-500 mt-2">{stats.submissions}</p>
            <p className="text-sm text-gray-400 mt-1">Menunggu review</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">👨‍🎓 Siswa</h2>
            <p className="text-3xl font-bold text-green-500 mt-2">{stats.students}</p>
            <p className="text-sm text-gray-400 mt-1">Total siswa terdaftar</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">📚 Tugas Aktif</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{studentStats.activeAssignments}</p>
            <p className="text-sm text-gray-400 mt-1">Tugas yang perlu dikerjakan</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">✅ Sudah Dikumpul</h2>
            <p className="text-3xl font-bold text-green-500 mt-2">{studentStats.mySubmissions}</p>
            <p className="text-sm text-gray-400 mt-1">Total submisi Anda</p>
          </div>
        </div>
      )}
    </div>
  );
}
