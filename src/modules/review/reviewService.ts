import { prisma } from "@/lib/prisma";

export const reviewService = {
  // Save or update a teacher review
  async saveReview(
    submissionId: string, 
    teacherId: string, 
    finalScore: number, 
    finalFeedback: string,
    publish: boolean = false
  ) {
    const status = publish ? "PUBLISHED" as const : "DRAFT" as const;
    const reviewedAt = publish ? new Date() : null;

    // Use upsert to handle both create and update
    const review = await prisma.teacherReview.upsert({
      where: { submissionId },
      create: {
        submissionId,
        teacherId,
        finalScore,
        finalFeedback,
        status,
        reviewedAt
      },
      update: {
        teacherId,
        finalScore,
        finalFeedback,
        status,
        reviewedAt: publish ? new Date() : undefined
      }
    });

    // Update submission status if published
    if (publish) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "PUBLISHED" }
      });
    }

    return review;
  }
};
