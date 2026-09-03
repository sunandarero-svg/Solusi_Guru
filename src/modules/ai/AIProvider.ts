export interface RubricScore {
  rubricCriterionId: string;
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface AIErrorHighlight {
  word: string;
  correction: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  pageIndex: number;
}

export interface AIAssessmentResult {
  totalScore: number;
  generalFeedback: string;
  rubricScores: RubricScore[];
  errorHighlights?: AIErrorHighlight[];
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

