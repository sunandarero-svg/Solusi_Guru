import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Minimal schemas
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  role: String,
  fullName: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const teacherProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fullName: String
});
const TeacherProfile = mongoose.models.TeacherProfile || mongoose.model('TeacherProfile', teacherProfileSchema);

const classSchema = new Schema({
  name: String
});
const Class = mongoose.models.Class || mongoose.model('Class', classSchema);

const subjectSchema = new Schema({
  name: String
});
const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

const teacherClassSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile' },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' }
});
const TeacherClass = mongoose.models.TeacherClass || mongoose.model('TeacherClass', teacherClassSchema);

async function checkDb() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const teachers = await TeacherProfile.find().populate('userId').lean();
  console.log(`Found ${teachers.length} teachers.`);

  for (const teacher of teachers) {
    if (teacher.userId) {
       console.log(`\nTeacher: ${teacher.fullName} (Email: ${(teacher.userId as any).email})`);
       const classes = await TeacherClass.find({ teacherId: teacher._id })
          .populate('classId')
          .populate('subjectId')
          .lean();
       
       console.log(`  Linked classes: ${classes.length}`);
       for (const tc of classes) {
          const className = tc.classId ? (tc.classId as any).name : 'MISSING CLASS';
          const subjectName = tc.subjectId ? (tc.subjectId as any).name : 'MISSING SUBJECT';
          console.log(`  - Class: ${className}, Subject: ${subjectName}`);
       }
    }
  }

  process.exit(0);
}

checkDb().catch(console.error);
