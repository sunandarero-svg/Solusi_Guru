export interface OCRResult {
  text: string;
  confidence: number;
  status: "SUCCESS" | "FAILED";
}

export interface OCRProvider {
  /**
   * Identifies the provider for logging and database records.
   */
  readonly providerName: string;

  /**
   * Processes a document (PDF or image) and returns the extracted text.
   * @param filePath Absolute path or URL to the document to process
   */
  processDocument(filePath: string): Promise<OCRResult>;
}
