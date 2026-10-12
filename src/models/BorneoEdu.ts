import mongoose, { Schema, Document } from 'mongoose';

export interface IBorneoEduQuestionAttempt {
  questionId: string;
  questionText: string;
  chosenOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  difficulty: string;
  world: number;
  level: number;
  timestamp: Date;
}

export interface IBorneoEduStudentResult extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  studentNumber: string; // Nomor Absen / NISN
  className: string;
  subject: string;
  materi: string;
  highestLevel: number;
  completedLevels: number[];
  completedWorlds: number;
  totalScore: number;
  totalCoins: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  accuracy: number;
  highestCombo: number;
  bossesDefeated: number;
  badges: string[];
  finalScore: number; // 0-100
  gameStatus: 'Sedang Berjalan' | 'Selesai' | 'Game Over';
  questionHistory: IBorneoEduQuestionAttempt[];
  checkpointData?: {
    currentLevel: number;
    lives: number;
    coins: number;
    score: number;
    powerUps: {
      mushroom: number;
      hint: number;
      star: number;
      shield: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const BorneoEduStudentResultSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, required: true },
  studentNumber: { type: String, default: '-' },
  className: { type: String, default: 'Kelas 7' },
  subject: { type: String, default: 'Informatika & Sains' },
  materi: { type: String, default: 'Petualangan Borneo Edu' },
  highestLevel: { type: Number, default: 1 },
  completedLevels: { type: [Number], default: [] },
  completedWorlds: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  totalCoins: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  highestCombo: { type: Number, default: 0 },
  bossesDefeated: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  finalScore: { type: Number, default: 0 },
  gameStatus: { type: String, default: 'Sedang Berjalan' },
  questionHistory: [
    {
      questionId: String,
      questionText: String,
      chosenOption: String,
      correctAnswer: String,
      isCorrect: Boolean,
      timeSpentSeconds: Number,
      difficulty: String,
      world: Number,
      level: Number,
      timestamp: { type: Date, default: Date.now },
    }
  ],
  checkpointData: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

export const BorneoEduStudentResult = mongoose.models.BorneoEduStudentResult || 
  mongoose.model<IBorneoEduStudentResult>('BorneoEduStudentResult', BorneoEduStudentResultSchema);

export interface IBorneoEduQuestion extends Document {
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
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'HOTS' | 'BOSS';
  explanation: string;
  stage?: 'Pengetahuan' | 'Pemahaman' | 'Penerapan' | 'Analisis' | 'HOTS';
  isBossQuestion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BorneoEduQuestionSchema: Schema = new Schema({
  questionId: { type: String, required: true, unique: true },
  world: { type: Number, required: true },
  level: { type: Number, required: true },
  question: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD', 'HOTS', 'BOSS'], required: true },
  explanation: { type: String, required: true },
  stage: { type: String, default: 'Pengetahuan' },
  isBossQuestion: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const BorneoEduQuestion = mongoose.models.BorneoEduQuestion || 
  mongoose.model<IBorneoEduQuestion>('BorneoEduQuestion', BorneoEduQuestionSchema);

export interface IBorneoEduConfig extends Document {
  teacherPin: string;
  weightAccuracy: number;
  weightLevel: number;
  weightBoss: number;
  timeEasy: number;
  timeMedium: number;
  timeHard: number;
  timeBoss: number;
  allowLevelReplay: boolean;
  badgeBronzeLevels: number;
  badgeSilverScore: number;
  badgeGoldScore: number;
  badgeGoldAccuracy: number;
  badgeSuperScore: number;
  badgeSuperCombo: number;
  soundEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BorneoEduConfigSchema: Schema = new Schema({
  teacherPin: { type: String, default: 'guru123' },
  weightAccuracy: { type: Number, default: 60 },
  weightLevel: { type: Number, default: 25 },
  weightBoss: { type: Number, default: 15 },
  timeEasy: { type: Number, default: 30 },
  timeMedium: { type: Number, default: 20 },
  timeHard: { type: Number, default: 15 },
  timeBoss: { type: Number, default: 30 },
  allowLevelReplay: { type: Boolean, default: true },
  badgeBronzeLevels: { type: Number, default: 25 },
  badgeSilverScore: { type: Number, default: 2000 },
  badgeGoldScore: { type: Number, default: 3000 },
  badgeGoldAccuracy: { type: Number, default: 85 },
  badgeSuperScore: { type: Number, default: 4000 },
  badgeSuperCombo: { type: Number, default: 5 },
  soundEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BorneoEduConfig = mongoose.models.BorneoEduConfig || 
  mongoose.model<IBorneoEduConfig>('BorneoEduConfig', BorneoEduConfigSchema);
