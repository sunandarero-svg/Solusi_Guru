import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { Assignment, AssignmentStatus } from "@/models/Assignment";
import { Submission, SubmissionStatus } from "@/models/Submission";
import { Enrollment } from "@/models/Class";
import { redirect } from "next/navigation";
import { FileText, Inbox, Users, BookOpen, CheckCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userEmail = session?.user?.email;

  // Redirect admin to admin dashboard
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  let stats = { assignments: 0, submissions: 0, students: 0 };

  await dbConnect();

  if (role === "TEACHER") {
    // Populate User to match email
    const teacherProfile = await TeacherProfile.findOne().populate({
      path: 'userId',
      match: { email: userEmail ?? "" }
    }).lean();

    // Since we filtered via populate match, if userId is null, it didn't match.
    // Better way: Find user first
    const user = await User.findOne({ email: userEmail ?? "" }).lean();

    if (user) {
      const profile = await TeacherProfile.findOne({ userId: user._id }).lean();
      if (profile) {
        const [assignmentCount, submissionCount, studentCount] = await Promise.all([
          Assignment.countDocuments({
            teacherId: profile._id,
          }),
          // Find assignments by teacher to filter submissions
          Assignment.find({ teacherId: profile._id }).select('_id').lean().then(async (assignments) => {
            const assignmentIds = assignments.map(a => a._id);
            return Submission.countDocuments({
              assignmentId: { $in: assignmentIds },
              status: SubmissionStatus.NEEDS_TEACHER_REVIEW,
            });
          }),
          StudentProfile.countDocuments(),
        ]);

        stats = {
          assignments: assignmentCount,
          submissions: submissionCount,
          students: studentCount,
        };
      }
    }
  }

  let studentStats = { activeAssignments: 0, mySubmissions: 0 };

  if (role === "STUDENT") {
    const user = await User.findOne({ email: userEmail ?? "" }).lean();

    if (user) {
      const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
      
      if (studentProfile) {
        const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
        const classIds = enrollments.map(e => e.classId);

        const [activeAssignmentCount, submissionCount] = await Promise.all([
          Assignment.countDocuments({
            classId: { $in: classIds },
            status: AssignmentStatus.PUBLISHED,
          }),
          Submission.countDocuments({
            studentId: studentProfile._id,
          }),
        ]);

        studentStats = {
          activeAssignments: activeAssignmentCount,
          mySubmissions: submissionCount,
        };
      }
    }
  }

  const roleLabel = role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Guru" : "Siswa";
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Selamat datang kembali! Anda masuk sebagai <span className="font-bold text-blue-600">{roleLabel}</span>
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-400 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-slate-200/50 inline-block backdrop-blur-sm">
          📅 {today}
        </div>
      </div>

      {role === "TEACHER" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Tugas</p>
                <h2 className="text-4xl font-black text-slate-800 mt-1">{stats.assignments}</h2>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <FileText size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-600 font-semibold relative z-10">
              <TrendingUp size={16} />
              <span>Aktif berjalan</span>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Submisi Baru</p>
                <h2 className="text-4xl font-black text-slate-800 mt-1">{stats.submissions}</h2>
              </div>
              <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                <Inbox size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-orange-500 font-semibold relative z-10">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>Menunggu review Anda</span>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
                <h2 className="text-4xl font-black text-slate-800 mt-1">{stats.students}</h2>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <Users size={24} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500 font-medium relative z-10">
              <span>Terdaftar di sistem</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 border-l-4 border-l-blue-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tugas Aktif</p>
                <h2 className="text-4xl font-black text-slate-800 mt-1">{studentStats.activeAssignments}</h2>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <BookOpen size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium relative z-10">Tugas yang perlu Anda kerjakan</p>
          </div>

          <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 border-l-4 border-l-emerald-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Selesai Dikumpul</p>
                <h2 className="text-4xl font-black text-slate-800 mt-1">{studentStats.mySubmissions}</h2>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <CheckCircle size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium relative z-10">Total seluruh tugas yang telah disubmit</p>
          </div>
        </div>
      )}
    </div>
  );
}

