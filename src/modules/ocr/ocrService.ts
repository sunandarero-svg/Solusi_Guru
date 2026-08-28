import dbConnect from "@/lib/mongoose";
import { SubmissionDocument, OCRResult, SubmissionPage } from "@/models/Submission";
import { OCRProvider } from "./OCRProvider";
import { TesseractOCRProvider } from "./TesseractOCRProvider";

export class OCRService {
  private provider: OCRProvider;

  constructor(provider: OCRProvider) {
    this.provider = provider;
  }

  /**
   * Execute OCR on a submission's pages
   */
  async processSubmission(submissionId: string) {
    await dbConnect();

    // 1. Get the submission pages
    const pages = await SubmissionPage.find({ submissionId }).sort({ pageNumber: 1 }).lean();

    if (!pages || pages.length === 0) {
      throw new Error(`No pages found for submission ID ${submissionId}`);
    }

    // 2. Execute OCR Provider on each page
    let combinedText = "";
    let totalConfidence = 0;

    for (const page of pages) {
      let result;
      let attempt = 0;
      const maxRetries = 2;

      while (attempt <= maxRetries) {
        try {
          result = await this.provider.processDocument(page.storageKey);
          break;
        } catch (error) {
          attempt++;
          console.warn(`[OCR] Attempt ${attempt} failed on page ${page.pageNumber}:`, error);
          if (attempt > maxRetries) {
            throw new Error(`OCR processing failed after ${maxRetries} retries: ${error}`);
          }
          await new Promise(res => setTimeout(res, attempt * 1000));
        }
      }

      if (result) {
        combinedText += `[Halaman ${page.pageNumber}]\n${result.text}\n\n`;
        totalConfidence += result.confidence;
      }
    }

    if (!combinedText.trim()) {
      throw new Error("OCR extraction resulted in empty data");
    }

    const avgConfidence = totalConfidence / pages.length;

    // 3. Save result to database
    const ocrRecord = await OCRResult.create({
      submissionId: submissionId,
      provider: this.provider.providerName,
      extractedText: combinedText.trim(),
      confidence: avgConfidence,
      status: "SUCCESS",
    });

    return ocrRecord.toObject();
  }
}

// Instantiate with TesseractOCRProvider
export const ocrService = new OCRService(new TesseractOCRProvider());
