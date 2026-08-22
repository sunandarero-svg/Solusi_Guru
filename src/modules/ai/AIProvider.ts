export interface RubricScore {
  rubricCriterionId: string;
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface AIAssessmentResult {
  totalScore: number;
  generalFeedback: string;
  rubricScores: RubricScore[];
}

export interface AIProvider {
  readonly providerName: string;

  /**
   * Assesses a student's submission based on extracted text and rubrics.
   * @param ocrText The text extracted from the student's submission
   * @param rubrics The rubrics defined for the assignment
   */
  assessSubmission(ocrText: string, rubrics: any[]): Promise<AIAssessmentResult>;
}
