import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
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
  async assessSubmission(submissionId: string, options?: { forceProvider?: string }) {
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

    // 2c. Fetch Assignment Questions (teacher configuration)
    let questions: any[] = [];
    try {
      questions = await AssignmentQuestion.find({ assignmentId: assignment._id }).sort({ order: 1 }).lean();
      if (questions.length > 0) {
        console.log(`[AI] Found ${questions.length} configured questions for assignment ${assignment._id}`);
      }
    } catch (err) {
      console.warn("[AI] Failed to fetch assignment questions:", err);
    }

    // 3. Request Assessment from AI Provider with Retry Logic (max 2 retries)
    let assessmentResult;
    let attempt = 0;
    const maxRetries = 2;
    let primaryFailed = false;

    // Estimate tokens: ~1000 for base prompt text + ~2000 per image page
    const estimatedTokens = 1000 + (pages.length * 2000);

    let primaryProvider = this.provider;
    let isOpenRouterForced = options?.forceProvider === "openrouter";

    // Smart Routing Logic: if estimated tokens > 7000, use OpenRouter (Llama 4 Scout)
    if (!isOpenRouterForced && estimatedTokens > 7000) {
      console.log(`[AI] Estimated tokens (${estimatedTokens}) > 7000. Automatically routing to OpenRouterProvider (Llama 4 Scout).`);
      isOpenRouterForced = true;
    }

    if (isOpenRouterForced) {
      console.log(`[AI] Using OpenRouterProvider as primary...`);
      const { OpenRouterProvider } = await import("./OpenRouterProvider");
      primaryProvider = new OpenRouterProvider();
    }

    while (attempt <= maxRetries) {
      try {
        assessmentResult = await primaryProvider.assessSubmission(
          pages as any, // Passed to provider which should handle array of pages/images
          [], // No longer using rubrics
          answerKey,
          questions
        );
        break; // Success, exit loop
      } catch (error) {
        attempt++;
        console.warn(`[AI] Attempt ${attempt} failed:`, error);
        if (attempt > maxRetries) {
          primaryFailed = true;
          console.error(`[AI] Primary provider failed after ${maxRetries} retries: ${error}`);
          break;
        }
        // Wait before retrying (exponential backoff: 1s, 2s, ...)
        await new Promise(res => setTimeout(res, attempt * 1000));
      }
    }

    // Fallback logic
    if (primaryFailed) {
      let secondarySuccess = false;

      if (isOpenRouterForced) {
        console.log(`[AI] Falling back to GroqProvider because OpenRouter was forced and failed...`);
        try {
          const { GroqProvider } = await import("./GroqProvider");
          const fallbackProvider = new GroqProvider();
          assessmentResult = await fallbackProvider.assessSubmission(
            pages as any,
            [],
            answerKey,
            questions
          );
          console.log(`[AI] GroqProvider fallback succeeded!`);
          Object.defineProperty(primaryProvider, "providerName", { value: fallbackProvider.providerName, configurable: true });
          secondarySuccess = true;
        } catch (fallbackError) {
          console.warn(`[AI] GroqProvider fallback also failed: ${fallbackError}`);
        }
      } else {
        console.log(`[AI] Falling back to OpenRouterProvider because Groq was primary and failed...`);
        try {
          const { OpenRouterProvider } = await import("./OpenRouterProvider");
          const fallbackProvider = new OpenRouterProvider();
          assessmentResult = await fallbackProvider.assessSubmission(
            pages as any,
            [],
            answerKey,
            questions
          );
          console.log(`[AI] OpenRouterProvider fallback succeeded!`);
          Object.defineProperty(primaryProvider, "providerName", { value: fallbackProvider.providerName, configurable: true });
          secondarySuccess = true;
        } catch (fallbackError) {
          console.warn(`[AI] OpenRouterProvider fallback also failed: ${fallbackError}`);
        }
      }

      if (!secondarySuccess) {
        throw new Error(`AI assessment failed on all providers (Groq and OpenRouter). Both providers exhausted.`);
      }
    }

    if (!assessmentResult) {
      throw new Error("AI assessment returned no result");
    }

    // Normalize and strictly enforce scores based on teacher's config
    let actualTotalScore = 0;
    const normalizedAnalyses = assessmentResult.analysis.map((analysis: any) => {
      const questionNumberString = String(analysis.questionNumber);
      const questionOrder = parseInt(questionNumberString.replace(/\D/g, '')) || 0;
      
      let maxScore = Number(analysis.maxScore) || 10;
      
      if (questions && questions.length > 0) {
        const matchedQuestion = questions.find(q => q.order === questionOrder);
        if (matchedQuestion && matchedQuestion.maxScore !== undefined) {
          maxScore = matchedQuestion.maxScore;
        }
      }
      
      let finalScore = Number(analysis.score) || 0;
      if (finalScore > maxScore) finalScore = maxScore;
      if (finalScore < 0) finalScore = 0;
      
      actualTotalScore += finalScore;
      
      return {
        ...analysis,
        questionNumber: questionNumberString,
        score: finalScore,
        maxScore: maxScore
      };
    });

    // 4. Save results to database
    const assessmentRecord = await AIAssessment.create({
      submissionId: submissionId,
      provider: this.provider.providerName,
      suggestedScore: actualTotalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    // Create analysis records separately
    const { StudentAnswerAnalysis } = await import("@/models/Submission");
    for (const analysis of normalizedAnalyses) {
      const combinedAnalysis = (analysis.reasoning_steps ? `**Penalaran AI:**\n${analysis.reasoning_steps}\n\n**Umpan Balik:**\n` : '') + (analysis.analysisText || analysis.analysis || "Tidak ada analisis.");
      
      await StudentAnswerAnalysis.create({
        assessmentId: assessmentRecord._id,
        questionNumber: analysis.questionNumber,
        studentAnswer: analysis.studentAnswer || "[Tidak terbaca/kosong]",
        score: analysis.score,
        maxScore: analysis.maxScore,
        analysis: combinedAnalysis,
        status: analysis.status || "OK",
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


