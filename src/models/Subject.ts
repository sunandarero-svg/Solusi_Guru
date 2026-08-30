import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, {
  timestamps: true
});

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
