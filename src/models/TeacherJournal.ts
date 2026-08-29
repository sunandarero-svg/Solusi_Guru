import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from './StudentAttendance';

export interface ITeacherJournal extends Document {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  date: Date;
  attendanceStatus: AttendanceStatus;
  topic: string;
  description: string;
}

const TeacherJournalSchema: Schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  attendanceStatus: { type: String, enum: Object.values(AttendanceStatus), required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true }
}, {
  timestamps: true
});

TeacherJournalSchema.index({ classId: 1, date: 1, teacherId: 1 }, { unique: true });

export const TeacherJournal = mongoose.models.TeacherJournal || mongoose.model<ITeacherJournal>('TeacherJournal', TeacherJournalSchema);
