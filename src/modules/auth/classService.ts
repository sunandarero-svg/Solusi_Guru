import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { Class, TeacherClass, Enrollment } from "@/models/Class";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import { mapId } from "@/lib/mapId";

export async function getAllClasses() {
  await dbConnect();
  const classes = await Class.find()
    .sort({ name: 1 })
    .lean();

  // Mongoose models need to be registered for populate to work
  StudentProfile.init();
  TeacherProfile.init();

  const populatedClasses = await Promise.all(classes.map(async (c) => {
    const enrollments = await Enrollment.find({ classId: c._id })
      .populate('studentId', 'fullName')
      .lean();
    
    const teachers = await TeacherClass.find({ classId: c._id })
      .populate('teacherId', 'fullName')
      .lean();

    return {
      ...c,
      enrollments: enrollments.map(e => ({ student: e.studentId })),
      teachers: teachers.map(t => ({ teacher: t.teacherId }))
    };
  }));

  return mapId(populatedClasses);
}

export async function getTeacherProfileByEmail(email: string) {
  await dbConnect();
  
  const user = await User.findOne({ email }).lean();
  if (!user) return null;

  const profile = await TeacherProfile.findOne({ userId: user._id }).lean();
  return mapId(profile);
}
