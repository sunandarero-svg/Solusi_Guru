import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment, Class } from "@/models/Class";
import { Assignment, AssignmentStatus } from "@/models/Assignment";
import { Submission } from "@/models/Submission";

export default async function MyAssignmentsPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  await dbConnect();
  
  const user = await User.findOne({ email: userEmail ?? "" }).lean();
  let assignments: any[] = [];

  if (user) {
    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();

    if (studentProfile) {
      const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
      const classIds = enrollments.map(e => e.classId);

      const foundAssignments = await Assignment.find({
        classId: { $in: classIds },
        status: AssignmentStatus.PUBLISHED,
      }).sort({ deadline: 1 }).lean();

      // We need to fetch the class details and the student's submission for each assignment
      const classDetails = await Class.find({ _id: { $in: classIds } }).lean();
      
      const assignmentIds = foundAssignments.map(a => a._id);
      const submissions = await Submission.find({
        assignmentId: { $in: assignmentIds },
        studentId: studentProfile._id,
      }).lean();

      assignments = foundAssignments.map(assignment => {
        const classObj = classDetails.find(c => c._id.toString() === assignment.classId.toString());
        const studentSubmission = submissions.find(s => s.assignmentId.toString() === assignment._id.toString());
        
        return {
          ...assignment,
          id: assignment._id.toString(), // For React keys
          class: classObj,
          submissions: studentSubmission ? [studentSubmission] : [],
        };
      });
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tugas Saya</h1>
      <p className="text-gray-500 mb-8">
        Daftar tugas yang tersedia untuk Anda
      </p>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">📚</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Tugas</h2>
          <p className="text-gray-400">
            Tugas dari guru Anda akan muncul di sini setelah dipublikasikan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(assignment => {
            const submission = assignment.submissions[0];
            const hasSubmitted = !!submission;
            const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date() && !hasSubmitted;

            return (
              <Link 
                href={`/dashboard/my-assignments/${assignment._id}`} 
                key={assignment.id}
                className="bg-white rounded-xl shadow border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">{assignment.title}</h2>
                  {hasSubmitted ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      ✅ Dikumpul
                    </span>
                  ) : isOverdue ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      ⏰ Terlambat
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      📝 Belum Dikumpul
                    </span>
                  )}
                </div>

                {assignment.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{assignment.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {assignment.class?.name || "Kelas"}
                  </span>
                  <div className="flex items-center space-x-2">
                    {assignment.deadline && (
                      <span>
                        Deadline: {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </span>
                    )}
                    <span className="text-blue-600 group-hover:translate-x-1 transition transform inline-block">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
