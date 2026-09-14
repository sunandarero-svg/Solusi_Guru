import { AIProvider, AIAssessmentResult } from "./AIProvider";

export class MockAIProvider implements AIProvider {
  readonly providerName = "MockAI";

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult> {
    // Simulate API processing delay (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let totalScore = 0;
    const analysis = [];

    // Mock 3 questions
    for (let i = 1; i <= 3; i++) {
      const percentage = 0.7 + Math.random() * 0.3;
      const score = Math.round(33 * percentage);
      totalScore += score;
      analysis.push({
        questionNumber: i.toString(),
        studentAnswer: `Jawaban mock untuk soal ${i}`,
        score: score,
        maxScore: 33,
        analysisText: `Jawaban siswa cukup baik secara konteks.`
      });
    }

    const generalFeedback = `Secara keseluruhan, pemahaman konsep sudah cukup baik. Pastikan untuk membaca ulang instruksi soal agar jawaban bisa lebih terarah dan spesifik.`;

    return {
      totalScore,
      generalFeedback,
      analysis,
    };
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `[MOCK ANSWER KEY]\n\nBerdasarkan soal yang diberikan:\n${taskText.substring(0, 200)}...\n\n1. Jawaban soal 1: [Mock jawaban]\n2. Jawaban soal 2: [Mock jawaban]\n3. Jawaban soal 3: [Mock jawaban]`;
  }
}

