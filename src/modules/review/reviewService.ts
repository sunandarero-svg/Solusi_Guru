import dbConnect from "@/lib/mongoose";
import { TeacherReview, Submission, SubmissionStatus, ReviewStatus } from "@/models/Submission";

export const reviewService = {
  // Save or update a teacher review
  async saveReview(
    submissionId: string, 
    teacherId: string, 
    finalScore: number, 
    finalFeedback: string,
    publish: boolean = false
  ) {
    await dbConnect();
    const status = publish ? ReviewStatus.PUBLISHED : ReviewStatus.DRAFT;
    const reviewedAt = publish ? new Date() : null;

    // Use findOneAndUpdate with upsert
    const review = await TeacherReview.findOneAndUpdate(
      { submissionId },
      {
        submissionId,
        teacherId,
        finalScore,
        finalFeedback,
        status,
        ...(reviewedAt && { reviewedAt })
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    // Update submission status if published
    if (publish) {
      await Submission.updateOne(
        { _id: submissionId },
        { status: SubmissionStatus.PUBLISHED }
      );
    }

    return review;
  }
};
