import { OCRProvider, OCRResult } from "./OCRProvider";
import Tesseract from "tesseract.js";
import path from "path";

export class TesseractOCRProvider implements OCRProvider {
  readonly providerName = "Tesseract.js";

  /**
   * Processes a document image (JPG/PNG) and returns the extracted text.
   * @param filePath Public storage path to the image
   */
  async processDocument(filePath: string): Promise<OCRResult> {
    try {
      const absolutePath = path.join(process.cwd(), "public", filePath);
      
      const result = await Tesseract.recognize(
        absolutePath,
        'eng+ind', // Support English and Indonesian
        { logger: m => console.log(`[Tesseract] ${m.status} - ${Math.round(m.progress * 100)}%`) }
      );
      
      return {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Normalize to 0-1
        status: "SUCCESS",
      };
    } catch (error) {
      console.error("[TesseractOCRProvider] Error processing document:", error);
      throw error;
    }
  }
}
