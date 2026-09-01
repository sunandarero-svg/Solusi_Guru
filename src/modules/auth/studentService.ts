import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import bcrypt from "bcryptjs";
import { mapId } from "@/lib/mapId";

export async function getAllStudents() {
  await dbConnect();
  
  import('@/models/Class').then(m => m.Class.init());

  const students = await StudentProfile.find()
    .populate('userId', 'email createdAt')
    .sort({ studentNumber: 1 })
    .lean();
    
  const populated = await Promise.all(students.map(async (s) => {
    const enrollments = await Enrollment.find({ studentId: s._id })
      .populate('classId', 'name')
      .lean();
      
    return {
      ...s,
      user: s.userId,
      enrollments: enrollments.map(e => ({ class: e.classId }))
    };
  }));
  
  return mapId(populated);
}

export async function createStudent(data: {
  email: string;
  password: string;
  fullName: string;
  studentNumber: string;
  classId?: string;
}) {
  await dbConnect();

  // Check existing user
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    email: data.email,
    passwordHash: hashedPassword,
    role: Role.STUDENT,
  });

  const studentProfile = await StudentProfile.create({
    userId: user._id,
    fullName: data.fullName,
    studentNumber: data.studentNumber,
  });

  if (data.classId) {
    await Enrollment.create({
      studentId: studentProfile._id,
      classId: data.classId,
    });
  }

  return mapId({ ...user.toObject(), studentProfile: studentProfile.toObject() });
}

export async function getStudentCount() {
  await dbConnect();
  return StudentProfile.countDocuments();
}

export async function deleteStudent(studentId: string) {
  await dbConnect();
  
  const student = await StudentProfile.findById(studentId).lean();
  if (!student) throw new Error("Student not found");

  // Delete associated user
  await User.findByIdAndDelete(student.userId);

  // Delete enrollments
  await Enrollment.deleteMany({ studentId });

  // Load models just in case
  import('@/models/Submission').then(m => {
    m.Submission.init();
    m.SubmissionPage.init();
    m.SubmissionDocument.init();
    m.OCRResult.init();
    m.AIAssessment.init();
    m.AssessmentCriterion.init();
    m.TeacherReview.init();
  });

  const { Submission, SubmissionPage, SubmissionDocument, OCRResult, AIAssessment, AssessmentCriterion, TeacherReview } = await import('@/models/Submission');

  // Find all submissions for this student
  const submissions = await Submission.find({ studentId }).lean();
  const submissionIds = submissions.map(s => s._id);

  if (submissionIds.length > 0) {
    // Delete submission related data
    await SubmissionPage.deleteMany({ submissionId: { $in: submissionIds } });
    await SubmissionDocument.deleteMany({ submissionId: { $in: submissionIds } });
    await OCRResult.deleteMany({ submissionId: { $in: submissionIds } });
    
    const assessments = await AIAssessment.find({ submissionId: { $in: submissionIds } }).lean();
    if (assessments.length > 0) {
      const assessmentIds = assessments.map(a => a._id);
      await AssessmentCriterion.deleteMany({ assessmentId: { $in: assessmentIds } });
      await AIAssessment.deleteMany({ _id: { $in: assessmentIds } });
    }

    await TeacherReview.deleteMany({ submissionId: { $in: submissionIds } });
    await Submission.deleteMany({ studentId });
  }

  // Delete student profile
  await StudentProfile.findByIdAndDelete(studentId);
  return true;
}

