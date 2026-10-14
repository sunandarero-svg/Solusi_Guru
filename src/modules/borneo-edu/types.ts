export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'HOTS' | 'BOSS';

export type QuestionStage = 'Pengetahuan' | 'Pemahaman' | 'Penerapan' | 'Analisis' | 'HOTS';

export interface QuestionItem {
  questionId: string;
  world: number;
  level: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: Difficulty;
  explanation: string;
  stage?: QuestionStage;
  isBossQuestion?: boolean;
  isActive?: boolean; // Guru bisa menonaktifkan soal tertentu
}

export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  chosenOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  difficulty: Difficulty;
  world: number;
  level: number;
  timestamp: string;
}

export interface PlayerPowerUps {
  mushroom: number; // Lives +1
  hintFlower: number; // 50-50 elimination
  superStar: number; // Double points for 3 questions
  shield: number; // Protects from 1 wrong/hit
}

export interface PlayerState {
  studentName: string;
  studentNumber: string; // Absen
  className: string;
  subject: string;
  materi: string;
  lives: number; // Starts at 3, max 5
  coins: number;
  score: number;
  combo: number;
  highestCombo: number;
  currentWorld: number;
  currentLevel: number;
  completedLevels: number[];
  completedWorlds: number;
  bossesDefeated: number;
  correctCount: number;
  wrongCount: number;
  powerUps: PlayerPowerUps;
  starBoostCount: number; // Remaining double-point questions
  shieldActive: boolean; // Active defense shield
  badges: string[];
  questionHistory: QuestionAttempt[];
  gameStatus: 'Sedang Berjalan' | 'Selesai' | 'Game Over';
  checkpointScore: number;
  checkpointCoins: number;
  lastUpdated?: string;
}

export interface TeacherConfig {
  teacherPin: string;
  weightAccuracy: number; // Default 60%
  weightLevel: number; // Default 25%
  weightBoss: number; // Default 15%
  timeEasy: number; // Default 30s
  timeMedium: number; // Default 20s
  timeHard: number; // Default 15s
  timeBoss: number; // Default 30s
  allowLevelReplay: boolean;
  badgeBronzeLevels: number;
  badgeSilverScore: number;
  badgeGoldScore: number;
  badgeGoldAccuracy: number;
  badgeSuperScore: number;
  badgeSuperCombo: number;
  soundEnabled: boolean;
  // Pengaturan jumlah soal & level yang dimainkan siswa
  maxQuestionsPerLevel: number; // Maks soal per level (default 4)
  activeLevelStart: number; // Level awal aktif (default 1)
  activeLevelEnd: number; // Level akhir aktif (default 25)
}

export interface WorldDefinition {
  id: number;
  name: string;
  themeTitle: string;
  description: string;
  materiTheme: string;
  levels: number[];
  bossLevel: number;
  bossName: string;
  bossTitle: string;
  palette: {
    skyTop: string;
    skyBottom: string;
    hills: string;
    terrain: string;
    platform: string;
    accent: string;
  };
}

export interface RecapStudentRow {
  no?: number;
  id?: string;
  studentName: string;
  studentNumber: string;
  className: string;
  subject: string;
  materi: string;
  highestLevel: number;
  completedLevelsCount: number;
  completedWorlds: number;
  totalScore: number;
  totalCoins: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  accuracy: number;
  highestCombo: number;
  bossesDefeated: number;
  badgeText: string;
  finalScore: number;
  gameStatus: string;
  updatedAt: string;
}
