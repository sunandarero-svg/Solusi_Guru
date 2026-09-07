import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment, AssessmentCriterion } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion, AssignmentAttachment } from "@/models/Assignment";
import { AIProvider } from "./AIProvider";
import { GroqProvider } from "./GroqProvider";

export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider = new GroqProvider()) {
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

    // 2b. Fetch AI Answer Key from teacher attachments (if available)
    let answerKey: string | undefined;
    try {
      const attachment = await AssignmentAttachment.findOne({
        assignmentId: assignment._id,
        aiAnswerKey: { $exists: true, $nin: [null, ""] },
      }).select("aiAnswerKey").lean();
      if (attachment?.aiAnswerKey) {
        answerKey = attachment.aiAnswerKey;
        console.log(`[AI] Found answer key for assignment ${assignment._id}, will use for concept-based comparison.`);
      }
    } catch (err) {
      console.warn("[AI] Failed to fetch answer key, proceeding without it:", err);
    }

    // 3. Request Assessment from AI Provider with Retry Logic (max 2 retries)
    let assessmentResult;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        assessmentResult = await this.provider.assessSubmission(
          pages as any, // Passed to provider which should handle array of pages/images
          rubricsWithCriteria,
          answerKey
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

    // 5. Process error highlights (Stabilo) if any
    if (assessmentResult.errorHighlights && assessmentResult.errorHighlights.length > 0) {
      const { drawHighlights } = await import("./imageEditor");
      const path = await import("path");
      const fs = await import("fs/promises");

      // Group highlights by page index
      const highlightsByPage: Record<number, any[]> = {};
      for (const hl of assessmentResult.errorHighlights) {
        if (!highlightsByPage[hl.pageIndex]) {
          highlightsByPage[hl.pageIndex] = [];
        }
        highlightsByPage[hl.pageIndex].push(hl);
      }

      // Process each page that has highlights
      for (const pageIndexStr of Object.keys(highlightsByPage)) {
        const pageIndex = parseInt(pageIndexStr);
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex] as any;
          const highlights = highlightsByPage[pageIndex];
          
          try {
            // Read original image
            let imageBuffer: Buffer;
            if (page.storageKey.startsWith("http")) {
              const res = await fetch(page.storageKey);
              const arrayBuffer = await res.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            } else {
              const localPath = path.join(process.cwd(), "public", page.storageKey.replace(/^\//, ''));
              imageBuffer = await fs.readFile(localPath);
            }

            // Draw highlights
            const highlightedBuffer = await drawHighlights(imageBuffer, highlights);

            // Save new image
            const originalFilename = path.basename(page.storageKey);
            const ext = path.extname(originalFilename);
            const newFilename = originalFilename.replace(ext, `_highlighted${ext}`);
            const newStorageKey = page.storageKey.replace(originalFilename, newFilename);
            
            if (!page.storageKey.startsWith("http")) {
              const newLocalPath = path.join(process.cwd(), "public", newStorageKey.replace(/^\//, ''));
              await fs.writeFile(newLocalPath, highlightedBuffer);
              
              // Update SubmissionPage record
              const { SubmissionPage } = await import("@/models/Submission");
              await SubmissionPage.updateOne(
                { _id: page._id },
                { $set: { highlightedStorageKey: newStorageKey } }
              );
            }
          } catch (err) {
            console.error(`Failed to process highlights for page ${pageIndex}:`, err);
          }
        }
      }
    }

    return assessmentRecord.toObject();
  }
}

// Instantiate with GroqProvider
export const aiService = new AIService(new GroqProvider());


