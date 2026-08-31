import dbConnect from "@/lib/mongoose";
import { Submission, SubmissionPage, SubmissionStatus } from "@/models/Submission";
import { Assignment } from "@/models/Assignment";
import { mapId } from "@/lib/mapId";

export const submissionService = {
  // Get active submission for a student (DRAFT or SUBMITTED)
  async getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string) {
    await dbConnect();
    const submission = await Submission.findOne({ assignmentId, studentId }).lean();
    if (!submission) return null;

    const pages = await SubmissionPage.find({ submissionId: submission._id }).sort({ pageNumber: 1 }).lean();
    return mapId({ ...submission, pages });
  },

  async getSubmissionById(submissionId: string) {
    await dbConnect();
    const submission = await Submission.findById(submissionId).lean();
    if (!submission) return null;

    const pages = await SubmissionPage.find({ submissionId: submission._id }).sort({ pageNumber: 1 }).lean();
    const assignment = await Assignment.findById(submission.assignmentId).lean();
    
    return mapId({ ...submission, pages, assignment });
  },

  // Create a new draft submission
  async createDraftSubmission(assignmentId: string, studentId: string) {
    await dbConnect();
    // Check if one already exists
    const existing = await this.getSubmissionByAssignmentAndStudent(assignmentId, studentId);
    if (existing) {
      return existing;
    }

    const submission = await Submission.create({
      assignmentId,
      studentId,
      status: SubmissionStatus.DRAFT
    });
    
    return mapId({ ...submission.toObject(), pages: [] });
  },

  // Add an uploaded page to a submission
  async addSubmissionPage(submissionId: string, data: {
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    pageNumber: number;
  }) {
    await dbConnect();
    return SubmissionPage.create({
      submissionId,
      ...data
    }).then(doc => mapId(doc.toObject()));
  },

  // Update page numbers (for reordering)
  async reorderPages(submissionId: string, pageIdsInOrder: string[]) {
    await dbConnect();
    // Perform updates without transaction because standalone MongoDB doesn't support them
    const operations = pageIdsInOrder.map((id, index) => 
      SubmissionPage.updateOne(
        { _id: id },
        { $set: { pageNumber: index + 1 } }
      )
    );

    return Promise.all(operations);
  },

  // Remove a page
  async removePage(pageId: string) {
    await dbConnect();
    return (await import("@/models/Submission")).SubmissionPage.deleteOne({ _id: pageId });
  },

  // Clear all pages for a submission
  async clearAllPages(submissionId: string) {
    await dbConnect();
    return (await import("@/models/Submission")).SubmissionPage.deleteMany({ submissionId });
  },

  // Submit the assignment
  async submitAssignment(submissionId: string, status: any = SubmissionStatus.SUBMITTED) {
    await dbConnect();
    const sub = await Submission.findByIdAndUpdate(
      submissionId,
      { status, submittedAt: new Date() },
      { returnDocument: 'after' }
    ).lean();
    return mapId(sub);
  },

  // Update submission status
  async updateStatus(submissionId: string, status: any) {
    await dbConnect();
    const sub = await Submission.findByIdAndUpdate(
      submissionId,
      { status },
      { returnDocument: 'after' }
    ).lean();
    return mapId(sub);
  },

  // Delete submission and all its associated data
  async deleteSubmission(submissionId: string) {
    await dbConnect();
    
    // Import other models if they are not all imported at the top,
    // but the best way is to import them at the top. Let's assume we can do it via mongoose.models or we'll add imports at the top.
    const mongoose = (await import('mongoose')).default;
    const { 
      SubmissionDocument, 
      SubmissionPage, 
      OCRResult, 
      AIAssessment, 
      AssessmentCriterion, 
      TeacherReview 
    } = mongoose.models;

    // We can just use the models directly if we require them.
    // Let's delete related records
    if (SubmissionPage) await SubmissionPage.deleteMany({ submissionId });
    if (SubmissionDocument) await SubmissionDocument.deleteMany({ submissionId });
    if (OCRResult) await OCRResult.deleteMany({ submissionId });
    
    if (AIAssessment) {
      const assessments = await AIAssessment.find({ submissionId }).lean();
      for (const ass of assessments) {
        if (AssessmentCriterion) await AssessmentCriterion.deleteMany({ assessmentId: ass._id });
      }
      await AIAssessment.deleteMany({ submissionId });
    }
    
    if (TeacherReview) await TeacherReview.deleteMany({ submissionId });
    
    // Finally delete the submission
    await Submission.findByIdAndDelete(submissionId);
    return true;
  }
};
