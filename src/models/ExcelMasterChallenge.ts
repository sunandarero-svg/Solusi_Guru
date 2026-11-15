import mongoose, { Schema, Document } from 'mongoose';

export interface IExcelMasterConfig extends Document {
  isLocked: boolean;
  lockMessage?: string;
  assignmentMode: 'ALL' | 'CLASS_ONLY' | 'SPECIFIC_STUDENTS';
  assignedClassIds: string[];
  assignedClassNames: string[];
  assignedStudentIds: string[];
  assignedStudentNames: string[];
  kkmScore: number;
  activeLevels: number[];
  instructions?: string;
  allowReplay: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExcelMasterConfigSchema: Schema = new Schema(
  {
    isLocked: { type: Boolean, default: false },
    lockMessage: {
      type: String,
      default: 'Game Excel Master Challenge sedang dikunci oleh guru.'
    },
    assignmentMode: {
      type: String,
      enum: ['ALL', 'CLASS_ONLY', 'SPECIFIC_STUDENTS'],
      default: 'ALL'
    },
    assignedClassIds: { type: [String], default: [] },
    assignedClassNames: { type: [String], default: [] },
    assignedStudentIds: { type: [String], default: [] },
    assignedStudentNames: { type: [String], default: [] },
    kkmScore: { type: Number, default: 75 },
    activeLevels: {
      type: [Number],
      default: [1, 2, 3, 4, 5]
    },
    instructions: {
      type: String,
      default: 'Taklukkan 50 tantangan Excel dalam 5 misi bertahap untuk meraih gelar Excel Grand Master!'
    },
    allowReplay: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'Guru' }
  },
  {
    timestamps: true
  }
);

export const ExcelMasterConfig =
  mongoose.models.ExcelMasterConfig ||
  mongoose.model<IExcelMasterConfig>('ExcelMasterConfig', ExcelMasterConfigSchema);

export interface IExcelMasterQuestionHistory {
  questionId: number;
  level: number;
  chosenOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSec: number;
}

export interface IExcelMasterStudentResult extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  highestLevel: number;
  unlockedLevels: number[];
  totalScore: number; // 0 - 5000
  correctCount: number;
  wrongCount: number;
  accuracy: number; // 0 - 100
  totalTimeSeconds: number;
  titleAwarded: string; // 'EXCEL GRAND MASTER' | 'EXCEL EXPERT' | etc.
  medals: string[]; // ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
  levelStats: Record<
    string,
    { score: number; correct: number; wrong: number; timeSec: number; medal: string }
  >;
  questionHistory: IExcelMasterQuestionHistory[];
  isCompleted: boolean;
  completedAt?: Date;
  lastResetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExcelMasterStudentResultSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    className: { type: String, default: 'Kelas Siswa' },
    highestLevel: { type: Number, default: 1 },
    unlockedLevels: { type: [Number], default: [1] },
    totalScore: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTimeSeconds: { type: Number, default: 0 },
    titleAwarded: { type: String, default: 'EXCEL BEGINNER' },
    medals: { type: [String], default: [] },
    levelStats: { type: Schema.Types.Mixed, default: {} },
    questionHistory: [
      {
        questionId: Number,
        level: Number,
        chosenOption: String,
        correctAnswer: String,
        isCorrect: Boolean,
        timeSec: Number
      }
    ],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastResetAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export const ExcelMasterStudentResult =
  mongoose.models.ExcelMasterStudentResult ||
  mongoose.model<IExcelMasterStudentResult>(
    'ExcelMasterStudentResult',
    ExcelMasterStudentResultSchema
  );
