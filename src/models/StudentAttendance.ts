import mongoose, { Schema, Document } from 'mongoose';

export enum AttendanceStatus {
  HADIR = 'HADIR',
  SAKIT = 'SAKIT',
  IZIN = 'IZIN',
  ALPA = 'ALPA'
}

export interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
}

export interface IStudentAttendance extends Document {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  date: Date;
  records: IAttendanceRecord[];
}

const AttendanceRecordSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  status: { type: String, enum: Object.values(AttendanceStatus), required: true }
});

const StudentAttendanceSchema: Schema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  records: [AttendanceRecordSchema]
}, {
  timestamps: true
});

StudentAttendanceSchema.index({ classId: 1, date: 1, teacherId: 1 }, { unique: true });

export const StudentAttendance = mongoose.models.StudentAttendance || mongoose.model<IStudentAttendance>('StudentAttendance', StudentAttendanceSchema);

