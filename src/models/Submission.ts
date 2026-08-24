import mongoose, { Schema, Document } from 'mongoose';

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  OCR_COMPLETED = 'OCR_COMPLETED',
  AI_COMPLETED = 'AI_COMPLETED',
  NEEDS_TEACHER_REVIEW = 'NEEDS_TEACHER_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED'
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED'
}

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: SubmissionStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  status: { type: String, enum: Object.values(SubmissionStatus), default: SubmissionStatus.DRAFT },
  submittedAt: { type: Date }
}, {
  timestamps: true
});

export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export interface ISubmissionPage extends Document {
  submissionId: mongoose.Types.ObjectId;
  pageNumber: number;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

const SubmissionPageSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
  pageNumber: { type: Number, required: true },
  storageKey: { type: String, required: true },
  originalFileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true }
});

export const SubmissionPage = mongoose.models.SubmissionPage || mongoose.model<ISubmissionPage>('SubmissionPage', SubmissionPageSchema);

export interface ISubmissionDocument extends Document {
  submissionId: mongoose.Types.ObjectId;
  storageKey: string;
  fileSize: number;
  pageCount: number;
  createdAt: Date;
}

const SubmissionDocumentSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true },
  storageKey: { type: String, required: true },
  fileSize: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const SubmissionDocument = mongoose.models.SubmissionDocument || mongoose.model<ISubmissionDocument>('SubmissionDocument', SubmissionDocumentSchema);

export interface IOCRResult extends Document {
  submissionId: mongoose.Types.ObjectId;
  provider: string;
  extractedText: string;
  confidence?: number;
  status: string;
  processedAt: Date;
}

const OCRResultSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
  provider: { type: String, required: true },
  extractedText: { type: String, required: true },
  confidence: { type: Number },
  status: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
});

export const OCRResult = mongoose.models.OCRResult || mongoose.model<IOCRResult>('OCRResult', OCRResultSchema);

export interface IAIAssessment extends Document {
  submissionId: mongoose.Types.ObjectId;
  provider: string;
  suggestedScore: number;
  confidence?: number;
  feedback?: string;
  status: string;
  createdAt: Date;
}

const AIAssessmentSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true },
  provider: { type: String, required: true },
  suggestedScore: { type: Number, required: true },
  confidence: { type: Number },
  feedback: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const AIAssessment = mongoose.models.AIAssessment || mongoose.model<IAIAssessment>('AIAssessment', AIAssessmentSchema);

export interface IAssessmentCriterion extends Document {
  assessmentId: mongoose.Types.ObjectId;
  rubricCriterionId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  reason?: string;
}

const AssessmentCriterionSchema: Schema = new Schema({
  assessmentId: { type: Schema.Types.ObjectId, ref: 'AIAssessment', required: true },
  rubricCriterionId: { type: Schema.Types.ObjectId, ref: 'RubricCriterion', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  reason: { type: String }
});

export const AssessmentCriterion = mongoose.models.AssessmentCriterion || mongoose.model<IAssessmentCriterion>('AssessmentCriterion', AssessmentCriterionSchema);

export interface ITeacherReview extends Document {
  submissionId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  finalScore: number;
  finalFeedback?: string;
  status: ReviewStatus;
  reviewedAt?: Date;
}

const TeacherReviewSchema: Schema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, unique: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  finalScore: { type: Number, required: true },
  finalFeedback: { type: String },
  status: { type: String, enum: Object.values(ReviewStatus), default: ReviewStatus.DRAFT },
  reviewedAt: { type: Date }
});

export const TeacherReview = mongoose.models.TeacherReview || mongoose.model<ITeacherReview>('TeacherReview', TeacherReviewSchema);
