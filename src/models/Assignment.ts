import mongoose, { Schema, Document } from 'mongoose';

export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  deadline?: Date;
  maxPages: number;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String },
  deadline: { type: Date },
  maxPages: { type: Number, default: 5 },
  status: { type: String, enum: Object.values(AssignmentStatus), default: AssignmentStatus.DRAFT }
}, {
  timestamps: true
});

export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export interface IRubric extends Document {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  totalScore: number;
}

const RubricSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  title: { type: String, required: true },
  totalScore: { type: Number, required: true }
});

export const Rubric = mongoose.models.Rubric || mongoose.model<IRubric>('Rubric', RubricSchema);

export interface IRubricCriterion extends Document {
  rubricId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  maxScore: number;
  order: number;
}

const RubricCriterionSchema: Schema = new Schema({
  rubricId: { type: Schema.Types.ObjectId, ref: 'Rubric', required: true },
  name: { type: String, required: true },
  description: { type: String },
  maxScore: { type: Number, required: true },
  order: { type: Number, required: true }
});

export const RubricCriterion = mongoose.models.RubricCriterion || mongoose.model<IRubricCriterion>('RubricCriterion', RubricCriterionSchema);

// === Assignment Attachment (Lampiran Tugas Guru) ===

export interface IAssignmentAttachment extends Document {
  assignmentId: mongoose.Types.ObjectId;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  extractedText?: string;
  aiAnswerKey?: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentAttachmentSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  storageKey: { type: String, required: true },
  originalFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  extractedText: { type: String },
  aiAnswerKey: { type: String },
  description: { type: String },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

AssignmentAttachmentSchema.index({ assignmentId: 1, order: 1 });

export const AssignmentAttachment = mongoose.models.AssignmentAttachment || mongoose.model<IAssignmentAttachment>('AssignmentAttachment', AssignmentAttachmentSchema);

