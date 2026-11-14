import dbConnect from "@/lib/mongoose";
import { Submission, OCRResult, AIAssessment } from "@/models/Submission";
import { Assignment, Rubric, RubricCriterion, AssignmentAttachment, AssignmentQuestion } from "@/models/Assignment";
import { AIProvider } from "./AIProvider";
import { GroqProvider } from "./GroqProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { gradeObjectiveQuestion, hasValidCorrectAnswer, isPureObjectiveType, parseAnswerKeyMap } from "@/modules/grading/systemGrader";

export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider = new OpenRouterProvider()) {
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

    // 2b. Fetch AI Answer Key from assignment (if available)
    let answerKey: string | undefined = assignment.aiAnswerKey;
    if (answerKey) {
      console.log(`[AI] Found answer key for assignment ${assignment._id}, will use for concept-based comparison.`);
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
    let isGroqForced = options?.forceProvider === "groq";

    if (isOpenRouterForced) {
      console.log(`[AI] Using OpenRouterProvider as primary...`);
      const { OpenRouterProvider } = await import("./OpenRouterProvider");
      primaryProvider = new OpenRouterProvider();
    } else if (isGroqForced) {
      console.log(`[AI] Using GroqProvider as primary...`);
      const { GroqProvider } = await import("./GroqProvider");
      primaryProvider = new GroqProvider();
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

    // Second Grading logic jika primary provider (OpenRouterProvider) gagal -> Fallback ke GroqProvider
    if (primaryFailed) {
      console.warn(`[AI] Primary provider (${primaryProvider.providerName}) gagal. Mengalihkan ke Second Grading (GroqProvider)...`);
      let secondarySuccess = false;

      // Cek apakah Groq memiliki key yang valid
      const groqKeysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY;
      if (groqKeysStr && groqKeysStr.trim().length > 5) {
        console.log(`[AI] Mencoba second grading ke GroqProvider...`);
        try {
          const { GroqProvider } = await import("./GroqProvider");
          const fallbackProvider = new GroqProvider();
          assessmentResult = await fallbackProvider.assessSubmission(
            pages as any,
            [],
            answerKey,
            questions
          );
          console.log(`[AI] GroqProvider second grading berhasil!`);
          Object.defineProperty(primaryProvider, "providerName", { value: fallbackProvider.providerName, configurable: true });
          secondarySuccess = true;
        } catch (fallbackError: any) {
          console.warn(`[AI] GroqProvider second grading juga gagal: ${fallbackError?.message || fallbackError}`);
        }
      } else {
        console.log(`[AI] Melewati second grading Groq (GROQ_API_KEYS tidak dikonfigurasi).`);
      }

      if (!secondarySuccess) {
        throw new Error(`AI assessment gagal pada seluruh provider. Primary provider (${primaryProvider.providerName}) exhausted.`);
      }
    }

    if (!assessmentResult) {
      throw new Error("AI assessment returned no result");
    }

    // Normalize and strictly enforce scores based on teacher's config
    let actualTotalScore = 0;
    const normalizedAnalyses: any[] = [];
    const answerKeyMap = parseAnswerKeyMap(answerKey || "");
    
    if (questions && questions.length > 0) {
      for (const q of questions) {
        const aiAnalysis = assessmentResult.analysis.find((a: any) => {
          const qn = parseInt(String(a.questionNumber).replace(/\D/g, '')) || 0;
          return qn === q.order;
        });

        let finalScore = 0;
        let maxScore = q.maxScore || 10;
        let reasoning = "";
        let analysisText = "Jawaban tidak ditemukan pada hasil pembacaan tulisan.";
        let validStatus = "UNREADABLE";
        let studentAnswer = "[Kosong/Tidak Terjawab]";

        if (aiAnalysis) {
          studentAnswer = aiAnalysis.studentAnswer || "[Kosong]";

          // Kunci jawaban efektif: prioritas q.correctAnswer, fallback ke answerKeyMap
          const fallbackKey = answerKeyMap.get(q.order)?.key;
          const effectiveCorrectAnswer = (q.correctAnswer && q.correctAnswer.trim().length > 0)
            ? q.correctAnswer
            : (fallbackKey || "");

          // === ATURAN: Soal Objektif Murni (PILIHAN_GANDA, BENAR_SALAH, PILIHAN_GANDA_BERTINGKAT/KOMPLEKS) HANYA DINILAI OLEH APLIKASI ===
          if (isPureObjectiveType(q.questionType)) {
            const systemResult = gradeObjectiveQuestion({
              questionNumber: String(q.order),
              questionType: q.questionType,
              studentAnswer,
              correctAnswer: effectiveCorrectAnswer,
              maxScore
            });

            if (systemResult !== null) {
              finalScore = systemResult.score;
              reasoning = systemResult.reasoning;
              analysisText = systemResult.analysisText;
              studentAnswer = systemResult.studentAnswer;
              validStatus = systemResult.status;
              console.log(`[System Grader] Soal ${q.order} (${q.questionType}): "${studentAnswer}" vs "${effectiveCorrectAnswer}" → ${finalScore}/${maxScore}`);
            } else {
              finalScore = 0;
              reasoning = `Kunci jawaban untuk soal ${q.questionType} tidak ditemukan.`;
              analysisText = `⚠️ Kunci jawaban belum dikonfigurasi.`;
              validStatus = "OK";
              console.warn(`[System Grader] Soal ${q.order} (${q.questionType}): Kunci jawaban tidak ditemukan.`);
            }
          } else if (hasValidCorrectAnswer({ questionType: q.questionType, correctAnswer: effectiveCorrectAnswer })) {
            // Soal Isian Singkat dengan kunci jawaban
            const systemResult = gradeObjectiveQuestion({
              questionNumber: String(q.order),
              questionType: q.questionType,
              studentAnswer,
              correctAnswer: effectiveCorrectAnswer,
              maxScore
            });
            if (systemResult !== null) {
              finalScore = systemResult.score;
              reasoning = systemResult.reasoning;
              analysisText = systemResult.analysisText;
              studentAnswer = systemResult.studentAnswer;
              validStatus = systemResult.status;
              console.log(`[System Grader] Soal ${q.order} (${q.questionType}): "${studentAnswer}" vs "${effectiveCorrectAnswer}" → ${finalScore}/${maxScore}`);
            } else {
              // Similarity rendah pada ISIAN_SINGKAT → evaluasi kontekstual AI
              finalScore = Number(aiAnalysis.score) || 0;
              if (finalScore > maxScore) finalScore = maxScore;
              if (finalScore < 0) finalScore = 0;
              reasoning = aiAnalysis.reasoning || "";
              analysisText = aiAnalysis.analysisText || "";
              validStatus = (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") ? aiAnalysis.status : "OK";
              console.log(`[AI Fallback] Soal ${q.order} (${q.questionType}): Evaluasi kontekstual AI: ${finalScore}/${maxScore}`);
            }
          } else {
            // Soal Non-Objektif (ESSAY atau tanpa kunci jawaban)
            finalScore = Number(aiAnalysis.score) || 0;
            if (finalScore > maxScore) finalScore = maxScore;
            if (finalScore < 0) finalScore = 0;
            reasoning = aiAnalysis.reasoning || "";
            analysisText = aiAnalysis.analysisText || "";
            validStatus = (aiAnalysis.status === "UNREADABLE" || aiAnalysis.status === "MANUAL_EDIT") ? aiAnalysis.status : "OK";
          }
        }

        actualTotalScore += finalScore;

        normalizedAnalyses.push({
          questionNumber: String(q.order),
          score: finalScore,
          maxScore,
          reasoning,
          analysisText,
          studentAnswer,
          status: validStatus
        });
      }
    } else {
      // Fallback jika tidak ada konfigurasi structured questions:
      // Cocokkan dengan answerKeyMap jika soal objektif terdeteksi
      assessmentResult.analysis.forEach((analysis: any) => {
        const qOrder = parseInt(String(analysis.questionNumber).replace(/\D/g, '')) || 0;
        let maxScore = Number(analysis.maxScore) || 10;
        let finalScore = Number(analysis.score) || 0;
        let reasoning = analysis.reasoning || "";
        let analysisText = analysis.analysisText || "";
        let studentAnswer = analysis.studentAnswer || "[Kosong]";
        let validStatus = (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") ? analysis.status : "OK";

        const keyInfo = answerKeyMap.get(qOrder);
        if (keyInfo && keyInfo.detectedType && isPureObjectiveType(keyInfo.detectedType)) {
          const systemResult = gradeObjectiveQuestion({
            questionNumber: String(qOrder),
            questionType: keyInfo.detectedType,
            studentAnswer,
            correctAnswer: keyInfo.key,
            maxScore
          });
          if (systemResult !== null) {
            finalScore = systemResult.score;
            reasoning = systemResult.reasoning;
            analysisText = systemResult.analysisText;
            studentAnswer = systemResult.studentAnswer;
            validStatus = systemResult.status;
            console.log(`[System Grader Auto] Soal ${qOrder} (${keyInfo.detectedType}): "${studentAnswer}" vs "${keyInfo.key}" → ${finalScore}/${maxScore}`);
          }
        }

        if (finalScore > maxScore) finalScore = maxScore;
        if (finalScore < 0) finalScore = 0;

        actualTotalScore += finalScore;
        
        normalizedAnalyses.push({
          ...analysis,
          questionNumber: String(analysis.questionNumber),
          studentAnswer,
          score: finalScore,
          maxScore,
          reasoning,
          analysisText,
          status: validStatus
        });
      });
    }

    // Check for old assessment and clean up to avoid duplicates
    const oldAssessment = await AIAssessment.findOne({ submissionId }).lean();
    const { StudentAnswerAnalysis } = await import("@/models/Submission");
    
    if (oldAssessment) {
      await StudentAnswerAnalysis.deleteMany({ assessmentId: oldAssessment._id });
      await AIAssessment.deleteMany({ submissionId });
    }

    // 4. Save results to database
    const assessmentRecord = await AIAssessment.create({
      submissionId: submissionId,
      provider: this.provider.providerName,
      suggestedScore: actualTotalScore,
      feedback: assessmentResult.generalFeedback,
      status: "SUCCESS",
    });

    // Create analysis records separately
    for (const analysis of normalizedAnalyses) {
      let typoFeedback = "";
      if (analysis.typos && Array.isArray(analysis.typos) && analysis.typos.length > 0) {
        typoFeedback = "\n\n**Perbaikan Penulisan (Typo):**\n" + 
          analysis.typos.map((t: any) => `- "${t.salah}" ➡️ "${t.perbaikan}"`).join("\n");
      }

      let reasoningPart = "";
      if (analysis.reasoning) {
        reasoningPart = `**Penalaran:**\n${analysis.reasoning}\n\n`;
      } else if (analysis.reasoning_steps) {
        reasoningPart = `**Penalaran AI:**\n${analysis.reasoning_steps}\n\n`;
      }

      let feedbackPart = analysis.analysisText || analysis.analysis || "";
      
      // Jika kosong (krn conditional prompting untuk jawaban benar)
      if (!reasoningPart && !feedbackPart && analysis.score === analysis.maxScore) {
        feedbackPart = "✅ Sesuai dengan kunci jawaban.";
      } else if (!feedbackPart) {
        feedbackPart = "Tidak ada umpan balik.";
      }

      const combinedAnalysis = reasoningPart + (reasoningPart && feedbackPart !== "Tidak ada umpan balik." ? `**Umpan Balik:**\n` : '') + feedbackPart + typoFeedback;
      
      let validStatus = "OK";
      if (analysis.status === "UNREADABLE" || analysis.status === "MANUAL_EDIT") {
        validStatus = analysis.status;
      }

      await StudentAnswerAnalysis.create({
        assessmentId: assessmentRecord._id,
        questionNumber: analysis.questionNumber,
        studentAnswer: analysis.studentAnswer || "[Tidak terbaca/kosong]",
        score: analysis.score,
        maxScore: analysis.maxScore,
        analysis: combinedAnalysis,
        status: validStatus,
        typos: analysis.typos || [],
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

// Instantiate with OpenRouterProvider (NVIDIA Primary -> OpenRouter Fallback 1 -> Groq Fallback 2)
export const aiService = new AIService(new OpenRouterProvider());


