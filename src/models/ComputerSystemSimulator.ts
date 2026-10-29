import mongoose, { Schema, Document } from 'mongoose';

export interface IComputerSystemSimulatorConfig extends Document {
  isLocked: boolean;
  lockMessage?: string;
  assignedClassIds: string[];
  assignedClassNames: string[];
  kkmScore: number;
  activeLevels: number[];
  instructions?: string;
  allowReplay: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComputerSystemSimulatorConfigSchema: Schema = new Schema(
  {
    isLocked: { type: Boolean, default: false },
    lockMessage: {
      type: String,
      default: 'Simulator Sistem Komputer sedang dikunci oleh guru.'
    },
    assignedClassIds: { type: [String], default: [] },
    assignedClassNames: { type: [String], default: [] },
    kkmScore: { type: Number, default: 75 },
    activeLevels: {
      type: [Number],
      default: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
      ]
    },
    instructions: {
      type: String,
      default: 'Selesaikan tantangan arsitektur komputer, alur pemrosesan data, dan konversi heksadesimal, biner, serta oktal sesuai arahan guru.'
    },
    allowReplay: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'Guru' }
  },
  {
    timestamps: true
  }
);

export const ComputerSystemSimulatorConfig =
  mongoose.models.ComputerSystemSimulatorConfig ||
  mongoose.model<IComputerSystemSimulatorConfig>(
    'ComputerSystemSimulatorConfig',
    ComputerSystemSimulatorConfigSchema
  );

export interface IComputerSystemSimulatorStudentResult extends Document {
  studentId?: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  highestLevel: number;
  unlockedLevels: number[];
  levelScores: Record<
    string,
    { score: number; stars: number; mistakes?: number; timeSec?: number }
  >;
  totalScore: number;
  badges: string[];
  lastResetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComputerSystemSimulatorStudentResultSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    className: { type: String, default: 'Kelas 7' },
    highestLevel: { type: Number, default: 1 },
    unlockedLevels: { type: [Number], default: [1] },
    levelScores: { type: Schema.Types.Mixed, default: {} },
    totalScore: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    lastResetAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export const ComputerSystemSimulatorStudentResult =
  mongoose.models.ComputerSystemSimulatorStudentResult ||
  mongoose.model<IComputerSystemSimulatorStudentResult>(
    'ComputerSystemSimulatorStudentResult',
    ComputerSystemSimulatorStudentResultSchema
  );

