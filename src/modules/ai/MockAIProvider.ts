import { AIProvider, AIAssessmentResult } from "./AIProvider";

export class MockAIProvider implements AIProvider {
  readonly providerName = "MockAI";

  async assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult> {
    // Simulate API processing delay (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let totalScore = 0;
    const rubricScores = [];

    // Calculate a mock score for each rubric criterion
    // Expecting rubrics to be the array of Rubric, we process all criteria in the first rubric
    const firstRubric = rubrics[0];
    if (firstRubric && firstRubric.criteria) {
      for (const criterion of firstRubric.criteria) {
        const percentage = 0.7 + Math.random() * 0.3;
        const score = Math.round(criterion.maxScore * percentage);
        
        totalScore += score;
        
        rubricScores.push({
          rubricCriterionId: criterion.id,
          score: score,
          maxScore: criterion.maxScore,
          reasoning: `Jawaban siswa menunjukkan pemahaman yang memadai terhadap kriteria "${criterion.name}", namun masih ada ruang untuk penjelasan yang lebih mendalam.${answerKey ? " (Dinilai berdasarkan kunci jawaban referensi)" : ""}`
        });
      }
    }

    const generalFeedback = `Secara keseluruhan, pemahaman konsep sudah cukup baik. Pastikan untuk membaca ulang instruksi soal agar jawaban bisa lebih terarah dan spesifik.`;

    return {
      totalScore,
      generalFeedback,
      rubricScores,
    };
  }

  async generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `[MOCK ANSWER KEY]\n\nBerdasarkan soal yang diberikan:\n${taskText.substring(0, 200)}...\n\n1. Jawaban soal 1: [Mock jawaban]\n2. Jawaban soal 2: [Mock jawaban]\n3. Jawaban soal 3: [Mock jawaban]`;
  }
}

