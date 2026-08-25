import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  maxStudents: number;
  maxClasses: number;
  deletedAt?: Date | null;
  driveFolderId?: string;
}

const TeacherProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  maxStudents: { type: Number, default: 310 },
  maxClasses: { type: Number, default: 10 },
  deletedAt: { type: Date, default: null },
  driveFolderId: { type: String }
});

export const TeacherProfile = mongoose.models.TeacherProfile || mongoose.model<ITeacherProfile>('TeacherProfile', TeacherProfileSchema);

export interface IAdminProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
}

const AdminProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true }
});

export const AdminProfile = mongoose.models.AdminProfile || mongoose.model<IAdminProfile>('AdminProfile', AdminProfileSchema);

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  studentNumber: string;
  fullName: string;
}

const StudentProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentNumber: { type: String, required: true, unique: true },
  fullName: { type: String, required: true }
});

export const StudentProfile = mongoose.models.StudentProfile || mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
