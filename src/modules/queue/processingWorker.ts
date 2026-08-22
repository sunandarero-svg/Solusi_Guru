import { submissionService } from "@/modules/submission/submissionService";
import { pdfService } from "@/modules/pdf/pdfService";
import { ocrService } from "@/modules/ocr/ocrService";
import { aiService } from "@/modules/ai/aiService";

/**
 * Background worker to process submission asynchronously
 * It catches any errors and prevents the API from timing out.
 */
export const processingWorker = {
  async processSubmissionPipeline(submissionId: string) {
    try {
      // 1. Mark as processing
      await submissionService.updateStatus(submissionId, "PROCESSING");
      
      // 2. Generate PDF
      await pdfService.generatePDFFromSubmission(submissionId);
      
      // 3. Process OCR
      await ocrService.processSubmission(submissionId);
      
      // 4. Process AI Assessment
      await aiService.assessSubmission(submissionId);
      
      // 5. Mark as ready for teacher
      await submissionService.updateStatus(submissionId, "NEEDS_TEACHER_REVIEW");
      
      console.log(`[Worker] Successfully processed submission: ${submissionId}`);
    } catch (error) {
      console.error(`[Worker] Failed to process submission ${submissionId}:`, error);
      // Mark as failed so teacher/admin knows it didn't complete
      await submissionService.updateStatus(submissionId, "FAILED");
    }
  }
};
