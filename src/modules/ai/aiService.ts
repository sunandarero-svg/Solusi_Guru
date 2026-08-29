import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment, AssessmentCriterion } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion } from "@/models/Assignment";
import { AIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";

export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Execute AI Assessment on a submission
   */
  async assessSubmission(submissionId: string) {
    await dbConnect();
    
    // 1. Fetch submission with assignment and rubrics
    const submission = await Submission.findById(submissionId).lean();
    if (!submission) {
      throw new Error(`Submission not found for ID ${submissionId}`);
    }

    const assignment = await Assignment.findById(submission.assignmentId).lean();
    if (!assignment) {
      throw new Error(`Assignment not found for ID ${submission.assignmentId}`);
    }

    const rubrics = await Rubric.find({ assignmentId: assignment._id }).lean();
    const rubricsWithCriteria = await Promise.all(rubrics.map(async (r) => {
      const criteria = await RubricCriterion.find({ rubricId: r._id }).sort({ order: 1 }).lean();
      return { ...r, criteria };
    }));

    // 2. Fetch Submission Pages (Images) instead of OCR Result
    const pages = await import('@/models/Submission').then(m => m.SubmissionPage.find({ submissionId }).sort({ pageNumber: 1 }).lean());
    if (!pages || pages.length === 0) {
      throw new Error(`No pages found for submission ID ${submissionId}`);
    }

    // 3. Request Assessment from AI Provider with Retry Logic (max 2 retries)
    let assessmentResult;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        assessmentResult = await this.provider.assessSubmission(
          pages as any, // Passed to provider which should handle array of pages/images
          rubricsWithCriteria
        );
        break; // Success, exit loop
      } catch (error) {
        attempt++;
        console.warn(`[AI] Attempt ${attempt} failed:`, error);
        if (attempt > maxRetries) {
          throw new Error(`AI assessment failed after ${maxRetries} retries: ${error}`);
        }
        // Wait before retrying (exponential backoff: 1s, 2s, ...)
        await new Promise(res => setTimeout(res, attempt * 1000));
      }
    }

    if (!assessmentResult) {
      throw new Error("AI assessment returned no result");
    }

    // 4. Save results to database
    const assessmentRecord = await AIAssessment.create({
      submissionId: submissionId,
      provider: this.provider.providerName,
      suggestedScore: assessmentResult.totalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    // Create criteria separately
    for (const score of assessmentResult.rubricScores) {
      await AssessmentCriterion.create({
        assessmentId: assessmentRecord._id,
        rubricCriterionId: (score as any).rubricCriterionId,
        score: (score as any).score,
        maxScore: (score as any).maxScore,
        reason: (score as any).reasoning,
      });
    }

    return assessmentRecord.toObject();
  }
}

// Instantiate with GeminiProvider
export const aiService = new AIService(new GeminiProvider());
