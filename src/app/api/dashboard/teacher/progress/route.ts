import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { Class, TeacherClass, Enrollment } from "@/models/Class";
import { Assignment } from "@/models/Assignment";
import { Submission, TeacherReview, AIAssessment, ReviewStatus } from "@/models/Submission";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    // 1. Get all classes for this teacher
    const teacherClasses = await TeacherClass.find({ teacherId: teacherProfile._id }).lean();
    const classIds = teacherClasses.map(tc => tc.classId);
    const classes = await Class.find({ _id: { $in: classIds } }).lean();

    // 2. Prepare the response data structure
    const progressData = [];

    for (const cls of classes) {
      const clsId = cls._id.toString();

      // Find students in this class
      const enrollments = await Enrollment.find({ classId: clsId }).lean();
      const studentIds = enrollments.map(e => e.studentId);
      
      const studentProfiles = await StudentProfile.find({ _id: { $in: studentIds } }).lean();
      const studentUserIds = studentProfiles.map(sp => sp.userId);
      const studentUsers = await User.find({ _id: { $in: studentUserIds } }).lean();

      // Find assignments for this class created by this teacher
      const assignments = await Assignment.find({ classId: clsId, teacherId: teacherProfile._id }).lean();
      const assignmentIds = assignments.map(a => a._id);

      // Find submissions for these assignments
      const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } }).sort({ createdAt: -1 }).lean();
      const submissionIds = submissions.map(s => s._id);

      // Get reviews and AI assessments for these submissions
      const teacherReviews = await TeacherReview.find({ submissionId: { $in: submissionIds } }).lean();
      const aiAssessments = await AIAssessment.find({ submissionId: { $in: submissionIds } }).lean();

      let sudahPaham = 0;
      let mulaiPaham = 0;
      let belumPaham = 0;

      const studentsData = [];

      for (const student of studentProfiles) {
        // Find user if exists, otherwise fallback to profile fullName
        const sUser = studentUsers.find(u => u._id.toString() === student.userId?.toString());
        const studentName = sUser?.fullName || student.fullName;

        // Get student submissions
        const studentSubs = submissions.filter(s => s.studentId.toString() === student._id.toString());
        
        let totalScore = 0;
        let validScoresCount = 0;
        let latestFeedback = "Belum ada feedback dari sistem atau guru.";

        // We want the latest feedback (since submissions are sorted desc by createdAt)
        let foundFeedback = false;

        for (const sub of studentSubs) {
          const tReview = teacherReviews.find(r => r.submissionId.toString() === sub._id.toString());
          const aiAss = aiAssessments.find(a => a.submissionId.toString() === sub._id.toString());

          let score = null;
          
          if (tReview && tReview.status === ReviewStatus.PUBLISHED) {
            score = tReview.finalScore;
            if (!foundFeedback) {
              latestFeedback = tReview.finalFeedback || (aiAss?.feedback || "Tidak ada feedback spesifik");
              foundFeedback = true;
            }
          } else if (aiAss) {
            score = aiAss.suggestedScore;
            if (!foundFeedback) {
              latestFeedback = aiAss.feedback || "Belum ada evaluasi AI";
              foundFeedback = true;
            }
          }

          if (score !== null) {
            totalScore += score;
            validScoresCount++;
          }
        }

        let averageScore = 0;
        let status = "Belum Mengerjakan";

        if (validScoresCount > 0) {
          averageScore = Math.round(totalScore / validScoresCount);
          if (averageScore >= 80) {
            status = "Sudah Paham";
            sudahPaham++;
          } else if (averageScore >= 60) {
            status = "Mulai Paham";
            mulaiPaham++;
          } else {
            status = "Belum Paham";
            belumPaham++;
          }
        }

        studentsData.push({
          id: student._id.toString(),
          fullName: studentName,
          studentNumber: student.studentNumber,
          averageScore,
          status,
          latestFeedback
        });
      }

      // Submission Tracker Logic
      let kumpul = 0;
      let belumKumpul = 0;
      const missingDetails: any[] = [];
      const activeAssignments = assignments.filter(a => a.status === 'PUBLISHED');

      for (const student of studentProfiles) {
        const sUser = studentUsers.find(u => u._id.toString() === student.userId?.toString());
        const studentName = sUser?.fullName || student.fullName;
        
        let hasMissing = false;
        const missingAssignments: string[] = [];
        
        for (const a of activeAssignments) {
          const hasSub = submissions.some(
            s => s.assignmentId.toString() === a._id.toString() && s.studentId.toString() === student._id.toString()
          );
          if (!hasSub) {
            hasMissing = true;
            missingAssignments.push(a.title);
          }
        }
        
        if (hasMissing && activeAssignments.length > 0) {
          belumKumpul++;
          missingDetails.push({
            id: student._id.toString(),
            name: studentName,
            missing: missingAssignments
          });
        } else if (activeAssignments.length > 0) {
          kumpul++;
        }
      }

      progressData.push({
        id: clsId,
        name: cls.name,
        description: cls.description,
        progress: {
          sudahPaham,
          mulaiPaham,
          belumPaham,
          total: sudahPaham + mulaiPaham + belumPaham
        },
        tracker: {
          kumpul,
          belumKumpul,
          missingDetails,
          activeAssignmentsCount: activeAssignments.length
        },
        students: studentsData
      });
    }

    return NextResponse.json(progressData);
  } catch (error: any) {
    console.error("Teacher progress API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

