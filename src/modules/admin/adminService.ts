import dbConnect from "@/lib/mongoose";
import User, { Role } from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { Class, TeacherClass, Enrollment } from "@/models/Class";
import { Assignment } from "@/models/Assignment";
import bcrypt from "bcryptjs";
import { mapId } from "@/lib/mapId";

/**
 * Get all teachers (excluding soft-deleted)
 */
export async function getAllTeachers() {
  await dbConnect();
  
  const teachers = await TeacherProfile.find({ deletedAt: null })
    .populate('userId', 'email createdAt')
    .sort({ fullName: 1 })
    .lean();

  const mapped = await Promise.all(teachers.map(async (teacher) => {
    // Manually count classes and assignments since Mongoose populate _count isn't direct
    const classLinks = await TeacherClass.find({ teacherId: teacher._id }).lean();
    const classesCount = classLinks.length;
    const assignmentsCount = await Assignment.countDocuments({ teacherId: teacher._id });
    
    // We can also fetch the actual classes if needed
    const classIds = classLinks.map(c => c.classId);
    const classes = await Class.find({ _id: { $in: classIds } }).lean();

    return {
      ...teacher,
      user: teacher.userId,
      classes: classLinks.map((cl, i) => ({ ...cl, class: classes.find(c => c._id.toString() === cl.classId.toString()) })),
      _count: {
        classes: classesCount,
        assignments: assignmentsCount,
      }
    };
  }));
  return mapId(mapped);
}

/**
 * Get teacher by ID (excluding soft-deleted)
 */
export async function getTeacherById(teacherProfileId: string) {
  await dbConnect();
  const teacher = await TeacherProfile.findOne({ _id: teacherProfileId, deletedAt: null })
    .populate('userId', 'email')
    .lean();
  
  if (!teacher) return null;
  return mapId({ ...teacher, user: teacher.userId });
}

/**
 * Create a new teacher user + profile
 */
export async function createTeacher(data: {
  email: string;
  password: string;
  fullName: string;
  maxStudents?: number;
  maxClasses?: number;
}) {
  await dbConnect();
  
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    email: data.email,
    passwordHash: hashedPassword,
    role: Role.TEACHER,
  });

  const teacherProfile = await TeacherProfile.create({
    userId: user._id,
    fullName: data.fullName,
    maxStudents: data.maxStudents ?? 310,
    maxClasses: data.maxClasses ?? 10,
  });

  return mapId({ ...user.toObject(), teacherProfile: teacherProfile.toObject() });
}

/**
 * Soft-delete a teacher (set deletedAt timestamp)
 */
export async function deleteTeacher(teacherProfileId: string) {
  await dbConnect();
  
  const teacher = await TeacherProfile.findById(teacherProfileId);
  if (!teacher) {
    throw new Error("Guru tidak ditemukan");
  }

  if (teacher.deletedAt) {
    throw new Error("Guru sudah dihapus sebelumnya");
  }

  teacher.deletedAt = new Date();
  await teacher.save();

  return { success: true, message: "Guru berhasil dihapus (soft-delete)" };
}

/**
 * Reset teacher password to 'guru123'
 */
export async function resetTeacherPassword(teacherProfileId: string) {
  await dbConnect();
  
  const teacher = await TeacherProfile.findById(teacherProfileId);
  if (!teacher) {
    throw new Error("Guru tidak ditemukan");
  }

  const user = await User.findById(teacher.userId);
  if (!user) {
    throw new Error("Data user guru tidak ditemukan");
  }

  const hashedPassword = await bcrypt.hash("guru123", 10);
  user.passwordHash = hashedPassword;
  await user.save();

  return { success: true, message: "Password berhasil direset" };
}

/**
 * Update teacher quota (maxStudents, maxClasses)
 */
export async function updateTeacherQuota(
  teacherProfileId: string,
  data: { maxStudents?: number; maxClasses?: number }
) {
  await dbConnect();
  const teacher = await TeacherProfile.findOne({ _id: teacherProfileId, deletedAt: null });

  if (!teacher) {
    throw new Error("Guru tidak ditemukan");
  }

  if (data.maxStudents !== undefined) teacher.maxStudents = data.maxStudents;
  if (data.maxClasses !== undefined) teacher.maxClasses = data.maxClasses;
  await teacher.save();
  return mapId(teacher.toObject());
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
  await dbConnect();
  const [teacherCount, studentCount, classCount, assignmentCount] =
    await Promise.all([
      TeacherProfile.countDocuments({ deletedAt: null }),
      StudentProfile.countDocuments(),
      Class.countDocuments(),
      Assignment.countDocuments(),
    ]);

  return {
    teachers: teacherCount,
    students: studentCount,
    classes: classCount,
    assignments: assignmentCount,
  };
}

/**
 * Count students assigned to a teacher (through classes)
 */
export async function getTeacherStudentCount(teacherProfileId: string) {
  await dbConnect();
  
  const teacherClasses = await TeacherClass.find({ teacherId: teacherProfileId }).lean();
  const classIds = teacherClasses.map(tc => tc.classId);

  const enrollments = await Enrollment.find({ classId: { $in: classIds } }).lean();

  const uniqueStudentIds = new Set(enrollments.map((e) => e.studentId.toString()));
  return uniqueStudentIds.size;
}

