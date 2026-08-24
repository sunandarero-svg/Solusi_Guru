import dbConnect from "@/lib/mongoose";
import { SubmissionDocument, OCRResult } from "@/models/Submission";
import { OCRProvider } from "./OCRProvider";
import { MockOCRProvider } from "./MockOCRProvider";

export class OCRService {
  private provider: OCRProvider;

  constructor(provider: OCRProvider) {
    this.provider = provider;
  }

  /**
   * Execute OCR on a submission's PDF document
   */
  async processSubmission(submissionId: string) {
    await dbConnect();

    // 1. Get the submission document
    const document = await SubmissionDocument.findOne({ submissionId }).lean();

    if (!document) {
      throw new Error(`Submission document not found for submission ID ${submissionId}`);
    }

    // 2. Execute OCR Provider
    let result;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        result = await this.provider.processDocument(document.storageKey);
        break;
      } catch (error) {
        attempt++;
        console.warn(`[OCR] Attempt ${attempt} failed:`, error);
        if (attempt > maxRetries) {
          throw new Error(`OCR processing failed after ${maxRetries} retries: ${error}`);
        }
        await new Promise(res => setTimeout(res, attempt * 1000));
      }
    }

    if (!result) {
      throw new Error("OCR extraction resulted in empty data");
    }

    // 3. Save result to database
    const ocrRecord = await OCRResult.create({
      submissionId: submissionId,
      provider: this.provider.providerName,
      extractedText: result.text,
      confidence: result.confidence,
      status: result.status,
    });

    return ocrRecord.toObject();
  }
}

// Instantiate with MockOCRProvider by default for the MVP
export const ocrService = new OCRService(new MockOCRProvider());
