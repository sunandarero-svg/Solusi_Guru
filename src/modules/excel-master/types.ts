export interface MiniTableData {
  headers: string[];
  rows: (string | number)[][];
  highlightCell?: string;
}

export interface ExcelQuestion {
  id: number;
  level: number;
  questionNumberInLevel: number;
  theme: string;
  question: string;
  miniTable?: MiniTableData;
  formulaExample?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  hint: string;
  explanation: string;
}

export interface ExcelFlashcard {
  level: number;
  title: string;
  subtitle: string;
  concept: string;
  keyPoints: string[];
  visualMiniTable?: MiniTableData;
  formulaTip?: string;
  realWorldExample: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  theme: string;
  color: string;
  medalName: string;
  medalIcon: string;
  description: string;
  totalQuestions: number;
}

export interface StudentAnswerState {
  questionId: number;
  level: number;
  chosenOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timeSec: number;
}

export interface LevelResultSummary {
  level: number;
  score: number;
  correct: number;
  wrong: number;
  timeSec: number;
  medal: string;
}

export type ExcelMasterTitle =
  | 'EXCEL GRAND MASTER'
  | 'EXCEL EXPERT'
  | 'EXCEL ADVANCED'
  | 'EXCEL APPRENTICE'
  | 'EXCEL BEGINNER';
