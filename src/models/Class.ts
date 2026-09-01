import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  description?: string;
}

const ClassSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String }
});

export const Class = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
}

const EnrollmentSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true }
});
EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export interface ITeacherClass extends Document {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
}

const TeacherClassSchema: Schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true }
});
TeacherClassSchema.index({ teacherId: 1, classId: 1, subjectId: 1 }, { unique: true });

export const TeacherClass = mongoose.models.TeacherClass || mongoose.model<ITeacherClass>('TeacherClass', TeacherClassSchema);

