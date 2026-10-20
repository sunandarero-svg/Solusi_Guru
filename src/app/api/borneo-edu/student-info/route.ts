import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { StudentProfile } from '@/models/Profile';
import { Enrollment, Class } from '@/models/Class';
import { BorneoEduConfig, BorneoEduStudentResult } from '@/models/BorneoEdu';

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

    // Ambil konfigurasi kunci game guru
    const config = await BorneoEduConfig.findOne().lean();
    const isGlobalLocked = Boolean(config?.isLocked);
    const lockedClasses: string[] = config?.lockedClassNames || [];
    const lockMessage = config?.lockMessage || 'Game Petualangan Borneo Edu sedang dikunci oleh guru.';

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      // Fallback for demo or non-student user
      const defaultClass = 'Kelas 7A';
      const isClassLocked = isGlobalLocked || lockedClasses.includes(defaultClass);
      return NextResponse.json({
        studentName: session.user.name || session.user.email.split('@')[0],
        studentNumber: '01',
        className: defaultClass,
        isGameLocked: isClassLocked,
        lockReason: isClassLocked ? lockMessage : null
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

    // Periksa apakah game dikunci secara global atau per kelas siswa
    const isClassLocked = isGlobalLocked || lockedClasses.some((c) => c.toLowerCase().trim() === className.toLowerCase().trim());

    // Cek hasil siswa di database untuk deteksi reset
    const studentResult = await BorneoEduStudentResult.findOne({
      $or: [
        { studentId: user._id },
        { studentName: studentProfile.fullName.trim() }
      ]
    }).lean();

    return NextResponse.json({
      studentName: studentProfile.fullName,
      studentNumber: studentProfile.studentNumber || '01',
      className: className,
      classId: enrollment?.classId ? enrollment.classId.toString() : null,
      isGameLocked: isClassLocked,
      lockReason: isClassLocked ? lockMessage : null,
      lastResetAt: studentResult?.lastResetAt || null,
      highestLevel: studentResult?.highestLevel || 1,
      totalScore: studentResult?.totalScore || 0
    });
  } catch (error: any) {
    console.error('Error fetching student info for Borneo Edu:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
