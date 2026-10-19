import mongoose, { Schema, Document } from 'mongoose';

export interface IExcelAdventureConfig extends Document {
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

const ExcelAdventureConfigSchema: Schema = new Schema(
  {
    assignedClassIds: { type: [String], default: [] },
    assignedClassNames: { type: [String], default: [] },
    kkmScore: { type: Number, default: 75 },
    activeLevels: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    instructions: { type: String, default: 'Selesaikan seluruh misi dan latihan spreadsheet sesuai petunjuk guru.' },
    allowReplay: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'Guru' }
  },
  {
    timestamps: true
  }
);

export const ExcelAdventureConfig =
  mongoose.models.ExcelAdventureConfig ||
  mongoose.model<IExcelAdventureConfig>('ExcelAdventureConfig', ExcelAdventureConfigSchema);
