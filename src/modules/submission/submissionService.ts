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
    return SubmissionPage.deleteOne({ _id: pageId });
  },

  // Submit the assignment
  async submitAssignment(submissionId: string, status: any = SubmissionStatus.SUBMITTED) {
    await dbConnect();
    const sub = await Submission.findByIdAndUpdate(
      submissionId,
      { status, submittedAt: new Date() },
      { new: true }
    ).lean();
    return mapId(sub);
  },

  // Update submission status
  async updateStatus(submissionId: string, status: any) {
    await dbConnect();
    const sub = await Submission.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    ).lean();
    return mapId(sub);
  }
};
