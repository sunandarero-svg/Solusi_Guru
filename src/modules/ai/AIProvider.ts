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
   * @param answerKey Optional AI-generated answer key for concept-based comparison
   */
  assessSubmission(pages: any[], rubrics: any[], answerKey?: string): Promise<AIAssessmentResult>;

  /**
   * Generates an answer key from the task text extracted from teacher attachments.
   * @param taskText Combined extracted text from all teacher attachments
   * @param rubrics The rubrics for context
   * @param imageAttachments Optional image attachments for visual analysis
   * @returns The generated answer key as a string
   */
  generateAnswerKey(taskText: string, rubrics: any[], imageAttachments?: any[]): Promise<string>;
}

