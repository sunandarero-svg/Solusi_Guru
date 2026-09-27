import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class, Enrollment, TeacherClass } from "@/models/Class";
import { StudentProfile, TeacherProfile } from "@/models/Profile";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    // Ensure models are registered
    StudentProfile.init();
    TeacherProfile.init();

    const classData = await Class.findById(resolvedParams.id).lean();

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get enrollments
    const enrollments = await Enrollment.find({ classId: classData._id })
      .populate('studentId', 'fullName email studentNumber')
      .lean();

    // Get teachers
    const teachers = await TeacherClass.find({ classId: classData._id })
      .populate('teacherId', 'fullName email')
      .lean();

    const formattedData = {
      ...classData,
      enrollments: enrollments.map(e => ({ student: e.studentId })),
      teachers: teachers.map(t => ({ teacher: t.teacherId }))
    };

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("GET Class details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    const classId = resolvedParams.id;
    const classData = await Class.findById(classId);

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // 1. Delete Enrollments and TeacherClass associations
    await Enrollment.deleteMany({ classId });
    await TeacherClass.deleteMany({ classId });

    // 2. We need to delete Assignments for this class
    // We should import Assignment model dynamically to avoid top level cyclic deps if any, or just import it at top.
    // Let's import using mongoose.models or dynamic import
    const mongoose = require("mongoose");
    const Assignment = mongoose.models.Assignment || require("@/models/Assignment").Assignment;
    const AssignmentAttachment = mongoose.models.AssignmentAttachment || require("@/models/Assignment").AssignmentAttachment;
    const AssignmentQuestion = mongoose.models.AssignmentQuestion || require("@/models/Assignment").AssignmentQuestion;
    const Rubric = mongoose.models.Rubric || require("@/models/Assignment").Rubric;
    const RubricCriterion = mongoose.models.RubricCriterion || require("@/models/Assignment").RubricCriterion;
    
    const Submission = mongoose.models.Submission || require("@/models/Submission").Submission;
    const SubmissionPage = mongoose.models.SubmissionPage || require("@/models/Submission").SubmissionPage;
    const SubmissionDocument = mongoose.models.SubmissionDocument || require("@/models/Submission").SubmissionDocument;
    const OCRResult = mongoose.models.OCRResult || require("@/models/Submission").OCRResult;
    const AIAssessment = mongoose.models.AIAssessment || require("@/models/Submission").AIAssessment;
    const StudentAnswerAnalysis = mongoose.models.StudentAnswerAnalysis || require("@/models/Submission").StudentAnswerAnalysis;
    const TeacherReview = mongoose.models.TeacherReview || require("@/models/Submission").TeacherReview;

    const assignments = await Assignment.find({ classId });
    const assignmentIds = assignments.map((a: any) => a._id);

    if (assignmentIds.length > 0) {
      // Delete assignment related data
      await AssignmentAttachment.deleteMany({ assignmentId: { $in: assignmentIds } });
      await AssignmentQuestion.deleteMany({ assignmentId: { $in: assignmentIds } });
      
      const rubrics = await Rubric.find({ assignmentId: { $in: assignmentIds } });
      const rubricIds = rubrics.map((r: any) => r._id);
      if (rubricIds.length > 0) {
         await RubricCriterion.deleteMany({ rubricId: { $in: rubricIds } });
         await Rubric.deleteMany({ assignmentId: { $in: assignmentIds } });
      }

      // Find all submissions for these assignments
      const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } });
      const submissionIds = submissions.map((s: any) => s._id);

      if (submissionIds.length > 0) {
         await SubmissionPage.deleteMany({ submissionId: { $in: submissionIds } });
         await SubmissionDocument.deleteMany({ submissionId: { $in: submissionIds } });
         await OCRResult.deleteMany({ submissionId: { $in: submissionIds } });
         
         const assessments = await AIAssessment.find({ submissionId: { $in: submissionIds } });
         const assessmentIds = assessments.map((a: any) => a._id);
         if (assessmentIds.length > 0) {
            await StudentAnswerAnalysis.deleteMany({ assessmentId: { $in: assessmentIds } });
            await AIAssessment.deleteMany({ submissionId: { $in: submissionIds } });
         }
         
         await TeacherReview.deleteMany({ submissionId: { $in: submissionIds } });
         await Submission.deleteMany({ assignmentId: { $in: assignmentIds } });
      }

      await Assignment.deleteMany({ classId });
    }

    // 3. Delete the Class itself
    await Class.findByIdAndDelete(classId);

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Class error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
