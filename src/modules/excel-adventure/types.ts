export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
  format?: 'number' | 'currency' | 'percent';
};

export type CellData = {
  value: string | number;
  style?: CellStyle;
};

export type GridData = Record<string, CellData>;

export type Flashcard = {
  id: string;
  term: string;
  visualType: string;
  frontQuestion: string;
  explanation: string;
  example: string;
};

export type TaskType =
  | 'click_ui'
  | 'select_cell'
  | 'select_range'
  | 'cell_value'
  | 'cell_style'
  | 'cell_style_any_bg'
  | 'formula_result'
  | 'table_action'
  | 'create_chart';

export type Task = {
  id: string;
  instruction: string;
  type: TaskType;
  targetUI?: string;
  targetCell?: string;
  targetRange?: string;
  expectedValue?: string | number;
  expectedStyle?: any;
  styleKey?: keyof CellStyle;
  requireFormula?: boolean;
  expectedFunc?: string;
  expectedAction?: string;
  chartType?: 'bar' | 'line' | 'pie';
  hint: string;
};

export type LevelData = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  badgeName: string;
  color: string;
  flashcards: Flashcard[];
  initialGrid: GridData;
  tasks: Task[];
};

export type LevelScore = {
  score: number;
  rawPoints: number;
  stars: number;
  mistakes: number;
  timeSec: number;
  completedAt: string;
};

export type HistoryLog = {
  levelId: number;
  levelTitle: string;
  score: number;
  stars: number;
  timeSec: number;
  date: string;
};

export type StudentSessionData = {
  id: string;
  uid?: string;
  playerName: string;
  playerClass: string;
  playerAvatar: string;
  levelScores?: Record<number, LevelScore>;
  badgesCount?: number;
  updatedAt?: number;
};

export type ChartConfig = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labelRange: string; // e.g. "A2:A6"
  valueRange: string; // e.g. "B2:B6"
};
