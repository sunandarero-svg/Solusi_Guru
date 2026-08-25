import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import bcrypt from "bcryptjs";
import { mapId } from "@/lib/mapId";

export async function getAllStudents() {
  await dbConnect();
  
  import('@/models/Class').then(m => m.Class.init());

  const students = await StudentProfile.find()
    .populate('userId', 'email createdAt')
    .sort({ studentNumber: 1 })
    .lean();
    
  const populated = await Promise.all(students.map(async (s) => {
    const enrollments = await Enrollment.find({ studentId: s._id })
      .populate('classId', 'name')
      .lean();
      
    return {
      ...s,
      user: s.userId,
      enrollments: enrollments.map(e => ({ class: e.classId }))
    };
  }));
  
  return mapId(populated);
}

export async function createStudent(data: {
  email: string;
  password: string;
  fullName: string;
  studentNumber: string;
  classId?: string;
}) {
  await dbConnect();

  // Check existing user
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    email: data.email,
    passwordHash: hashedPassword,
    role: Role.STUDENT,
  });

  const studentProfile = await StudentProfile.create({
    userId: user._id,
    fullName: data.fullName,
    studentNumber: data.studentNumber,
  });

  if (data.classId) {
    await Enrollment.create({
      studentId: studentProfile._id,
      classId: data.classId,
    });
  }

  return mapId({ ...user.toObject(), studentProfile: studentProfile.toObject() });
}

export async function getStudentCount() {
  await dbConnect();
  return StudentProfile.countDocuments();
}
