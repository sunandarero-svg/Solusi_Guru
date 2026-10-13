import mongoose, { Schema, Document } from 'mongoose';

export type MaterialSourceType = 'AI' | 'MANUAL_UPLOAD';
export type MaterialFileType = 'video' | 'pdf' | 'docx' | 'ppt' | 'text' | 'other';

export interface IMaterial extends Document {
  title: string;
  description?: string;
  classId: mongoose.Types.ObjectId;
  className?: string;
  subjectId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  sourceType: MaterialSourceType;
  fileUrl?: string;
  fileName?: string;
  fileType?: MaterialFileType;
  fileSize?: number;
  content?: string; // Teks materi pembelajaran (dari AI atau hasil ekstraksi dokumen)
  summary?: string;
  isPublished: boolean;
  readByStudents: mongoose.Types.ObjectId[]; // List ID StudentProfile yang sudah menyelesaikan membaca
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    className: { type: String },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
    sourceType: {
      type: String,
      enum: ['AI', 'MANUAL_UPLOAD'],
      default: 'MANUAL_UPLOAD'
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: {
      type: String,
      enum: ['video', 'pdf', 'docx', 'ppt', 'text', 'other'],
      default: 'text'
    },
    fileSize: { type: Number },
    content: { type: String },
    summary: { type: String },
    isPublished: { type: Boolean, default: true },
    readByStudents: [{ type: Schema.Types.ObjectId, ref: 'StudentProfile' }]
  },
  {
    timestamps: true
  }
);

export const Material = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
export default Material;
