import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { getAuthSession } from '@/modules/auth/session';
import User from '@/models/User';
import { TeacherProfile, StudentProfile } from '@/models/Profile';
import { Class, TeacherClass, Enrollment } from '@/models/Class';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Hanya guru yang dapat mengakses daftar kelas dan siswa.' },
        { status: 403 }
      );
    }

    await dbConnect();

    let classes: any[] = [];

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      // Admin/Principal can assign to any class in the system
      classes = await Class.find().sort({ name: 1 }).lean();
    } else {
      // Teacher: find classes assigned to this teacher
      const user = await User.findOne({ email: session.user.email }).lean();
      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
      if (!teacher) {
        return NextResponse.json({ error: 'Profil guru tidak ditemukan' }, { status: 404 });
      }

      const teacherClasses = await TeacherClass.find({ teacherId: teacher._id })
        .populate('classId')
        .lean();

      const uniqueClassesMap = new Map<string, any>();
      teacherClasses.forEach((tc: any) => {
        if (tc.classId && tc.classId._id) {
          const idStr = tc.classId._id.toString();
          if (!uniqueClassesMap.has(idStr)) {
            uniqueClassesMap.set(idStr, tc.classId);
          }
        }
      });

      classes = Array.from(uniqueClassesMap.values());
    }

    // For each class, fetch enrolled students
    const classesWithStudents = await Promise.all(
      classes.map(async (c: any) => {
        const enrollments = await Enrollment.find({ classId: c._id })
          .populate('studentId')
          .lean();

        const students = enrollments
          .filter((e: any) => e.studentId)
          .map((e: any) => {
            const sp = e.studentId;
            return {
              id: sp._id.toString(),
              fullName: sp.fullName || 'Nama Siswa',
              studentNumber: sp.studentNumber || '-'
            };
          })
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        return {
          id: c._id.toString(),
          name: c.name || 'Kelas Tanpa Nama',
          students
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: classesWithStudents
    });
  } catch (error: any) {
    console.error('Error fetching classes and students for Excel Master:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data kelas dan siswa', details: error.message },
      { status: 500 }
    );
  }
}
