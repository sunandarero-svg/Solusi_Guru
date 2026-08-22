import { OCRProvider, OCRResult } from "./OCRProvider";

export class MockOCRProvider implements OCRProvider {
  readonly providerName = "MockOCR";

  async processDocument(filePath: string): Promise<OCRResult> {
    // Simulate API delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate random confidence between 0.80 and 0.98
    const confidence = 0.8 + Math.random() * 0.18;

    // Simulate mock handwritten text extraction
    const mockText = `Jawaban Tugas Biologi:
1. Mitokondria adalah organel sel yang berfungsi sebagai tempat respirasi seluler untuk menghasilkan energi dalam bentuk ATP.
2. Proses fotosintesis terbagi menjadi reaksi terang (di tilakoid) dan reaksi gelap / siklus Calvin (di stroma).
3. DNA berbentuk double helix dan memiliki basa nitrogen Adenin, Timin, Sitosin, dan Guanin.`;

    return {
      text: mockText,
      confidence: parseFloat(confidence.toFixed(4)),
      status: "SUCCESS",
    };
  }
}
