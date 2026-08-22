import { prisma } from "@/lib/prisma";
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
    // 1. Get the submission document
    const document = await prisma.submissionDocument.findUnique({
      where: { submissionId }
    });

    if (!document) {
      throw new Error(`Submission document not found for submission ID ${submissionId}`);
    }

    // 2. Execute OCR Provider
    // The storageKey might be relative like "/uploads/documents/xxx.pdf"
    // Retry logic (max 2 retries)
    let result;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        result = await this.provider.processDocument(document.storageKey);
        break; // Success, exit loop
      } catch (error) {
        attempt++;
        console.warn(`[OCR] Attempt ${attempt} failed:`, error);
        if (attempt > maxRetries) {
          throw new Error(`OCR processing failed after ${maxRetries} retries: ${error}`);
        }
        // Wait before retrying (exponential backoff: 1s, 2s, ...)
        await new Promise(res => setTimeout(res, attempt * 1000));
      }
    }

    if (!result) {
      throw new Error("OCR extraction resulted in empty data");
    }

    // 3. Save result to database
    const ocrRecord = await prisma.oCRResult.create({
      data: {
        submissionId: submissionId,
        provider: this.provider.providerName,
        extractedText: result.text,
        confidence: result.confidence,
        status: result.status,
      }
    });

    return ocrRecord;
  }
}

// Instantiate with MockOCRProvider by default for the MVP
export const ocrService = new OCRService(new MockOCRProvider());
