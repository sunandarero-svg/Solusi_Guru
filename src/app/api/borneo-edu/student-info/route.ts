import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { StudentProfile } from '@/models/Profile';
import { Enrollment, Class } from '@/models/Class';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      // Fallback for demo or non-student user
      return NextResponse.json({
        studentName: session.user.name || session.user.email.split('@')[0],
        studentNumber: '01',
        className: 'Kelas 7A'
      });
    }

    const enrollment = await Enrollment.findOne({ studentId: studentProfile._id }).lean();
    let className = 'Kelas 7A';
    if (enrollment) {
      const cls = await Class.findById(enrollment.classId).lean();
      if (cls && cls.name) {
        className = cls.name;
      }
    }

    return NextResponse.json({
      studentName: studentProfile.fullName,
      studentNumber: studentProfile.studentNumber || '01',
      className: className
    });
  } catch (error: any) {
    console.error('Error fetching student info for Borneo Edu:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
