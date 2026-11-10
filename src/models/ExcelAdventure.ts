import mongoose, { Schema, Document } from 'mongoose';

export interface IExcelAdventureConfig extends Document {
  isLocked: boolean;
  lockMessage?: string;
  assignedClassIds: string[];
  assignedClassNames: string[];
  kkmScore: number;
  activeLevels: number[];
  instructions?: string;
  allowReplay: boolean;
  // Fitur Penugasan Simulasi Ujian
  isExamActive: boolean;
  examAssignedClassIds: string[];
  examAssignedClassNames: string[];
  examDurationMinutes: number;
  examKkm: number;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExcelAdventureConfigSchema: Schema = new Schema(
  {
    isLocked: { type: Boolean, default: false },
    lockMessage: { type: String, default: 'Game Simulasi Excel sedang dikunci oleh guru.' },
    assignedClassIds: { type: [String], default: [] },
    assignedClassNames: { type: [String], default: [] },
    kkmScore: { type: Number, default: 75 },
    activeLevels: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    instructions: { type: String, default: 'Selesaikan seluruh misi dan latihan spreadsheet sesuai petunjuk guru.' },
    allowReplay: { type: Boolean, default: true },
    isExamActive: { type: Boolean, default: true },
    examAssignedClassIds: { type: [String], default: [] },
    examAssignedClassNames: { type: [String], default: [] },
    examDurationMinutes: { type: Number, default: 90 },
    examKkm: { type: Number, default: 75 },
    updatedBy: { type: String, default: 'Guru' }
  },
  {
    timestamps: true
  }
);

export const ExcelAdventureConfig =
  mongoose.models.ExcelAdventureConfig ||
  mongoose.model<IExcelAdventureConfig>('ExcelAdventureConfig', ExcelAdventureConfigSchema);

export interface IExcelAdventureStudentResult extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  highestLevel: number;
  unlockedLevels: number[];
  levelScores: Record<string, { score: number; stars: number; mistakes: number; timeSec: number }>;
  totalScore: number;
  badges: string[];
  lastResetAt?: Date;
  examScore?: number;
  examStars?: number;
  examBadge?: string;
  examPassed?: boolean;
  examCompletedAt?: Date;
  examDetails?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ExcelAdventureStudentResultSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    className: { type: String, default: 'Kelas 7' },
    highestLevel: { type: Number, default: 1 },
    unlockedLevels: { type: [Number], default: [1] },
    levelScores: { type: Schema.Types.Mixed, default: {} },
    totalScore: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    lastResetAt: { type: Date, default: null },
    examScore: { type: Number },
    examStars: { type: Number },
    examBadge: { type: String },
    examPassed: { type: Boolean },
    examCompletedAt: { type: Date },
    examDetails: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

export const ExcelAdventureStudentResult =
  mongoose.models.ExcelAdventureStudentResult ||
  mongoose.model<IExcelAdventureStudentResult>('ExcelAdventureStudentResult', ExcelAdventureStudentResultSchema);
