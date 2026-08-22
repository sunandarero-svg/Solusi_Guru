import { prisma } from "@/lib/prisma";
import { AIProvider } from "./AIProvider";
import { MockAIProvider } from "./MockAIProvider";

export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Execute AI Assessment on a submission
   */
  async assessSubmission(submissionId: string) {
    // 1. Fetch submission with assignment and rubrics
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            rubrics: {
              include: {
                criteria: true
              }
            }
          }
        }
      }
    });

    if (!submission) {
      throw new Error(`Submission not found for ID ${submissionId}`);
    }

    // 2. Fetch OCR Result
    const ocrResult = await prisma.oCRResult.findFirst({
      where: { submissionId }
    });

    if (!ocrResult) {
      throw new Error(`No OCR result found for submission ID ${submissionId}`);
    }

    // 3. Request Assessment from AI Provider with Retry Logic (max 2 retries)
    let assessmentResult;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        assessmentResult = await this.provider.assessSubmission(
          ocrResult.extractedText, 
          submission.assignment.rubrics
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
    const assessmentRecord = await prisma.aIAssessment.create({
      data: {
        submissionId: submissionId,
        provider: this.provider.providerName,
        suggestedScore: assessmentResult.totalScore,
        feedback: assessmentResult.generalFeedback,
        status: "SUCCESS",
        criteria: {
          create: assessmentResult.rubricScores.map((score: any) => ({
            rubricCriterionId: score.rubricCriterionId,
            score: score.score,
            maxScore: score.maxScore,
            reason: score.reasoning
          }))
        }
      }
    });

    return assessmentRecord;
  }
}

// Instantiate with MockAIProvider by default for the MVP
export const aiService = new AIService(new MockAIProvider());
