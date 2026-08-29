import { AIProvider, AIAssessmentResult } from "./AIProvider";

export class MockAIProvider implements AIProvider {
  readonly providerName = "MockAI";

  async assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult> {
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
          reasoning: `Jawaban siswa menunjukkan pemahaman yang memadai terhadap kriteria "${criterion.name}", namun masih ada ruang untuk penjelasan yang lebih mendalam.`
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
}
