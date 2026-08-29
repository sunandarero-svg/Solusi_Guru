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
   * Assesses a student's submission based on uploaded images and rubrics.
   * @param pages The images (SubmissionPages) uploaded by the student
   * @param rubrics The rubrics defined for the assignment
   */
  assessSubmission(pages: any[], rubrics: any[]): Promise<AIAssessmentResult>;
}
