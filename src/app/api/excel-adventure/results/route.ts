import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { StudentProfile } from '@/models/Profile';
import { Enrollment, Class } from '@/models/Class';
import { ExcelAdventureStudentResult } from '@/models/ExcelAdventure';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const className = searchParams.get('className');
    const studentName = searchParams.get('studentName');

    const isTeacher =
      session?.user?.role === 'TEACHER' ||
      session?.user?.role === 'ADMIN' ||
      session?.user?.role === 'PRINCIPAL';

    // 1. Jika Siswa meminta progres miliknya
    if (!isTeacher && session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).lean();
      let filter: any = {};
      if (user) {
        filter = {
          $or: [{ studentId: user._id }, { studentName: session.user.name || '' }]
        };
      } else if (studentName) {
        filter = { studentName: studentName.trim() };
      }

      const result = await ExcelAdventureStudentResult.findOne(filter).lean();
      return NextResponse.json({
        success: true,
        data: result || null
      });
    }

    // 2. Jika Guru / Admin meminta rekap siswa
    const query: any = {};
    if (className && className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${className.trim()}$`, 'i') };
    }
    if (studentName) {
      query.studentName = { $regex: new RegExp(studentName.trim(), 'i') };
    }

    const results = await ExcelAdventureStudentResult.find(query)
      .sort({ highestLevel: -1, totalScore: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('API Error fetching Excel Adventure results:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    let studentId: any = undefined;
    let studentName: string = body.studentName || session?.user?.name || 'Siswa';
    let className: string = body.playerClass || body.className || 'Kelas 7';

    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).lean();
      if (user) {
        studentId = user._id;
        const profile = await StudentProfile.findOne({ userId: user._id }).lean();
        if (profile) {
          studentName = profile.fullName;
          const enrollment = await Enrollment.findOne({ studentId: profile._id }).lean();
          if (enrollment) {
            const cls = await Class.findById(enrollment.classId).lean();
            if (cls && cls.name) className = cls.name;
          }
        }
      }
    }

    const highestLevel = Math.max(
      Number(body.highestLevel) || 1,
      ...(Array.isArray(body.unlockedLevels) ? body.unlockedLevels : [1])
    );

    const updatePayload = {
      studentId,
      studentName: studentName.trim(),
      className: className.trim(),
      highestLevel,
      unlockedLevels: body.unlockedLevels || [1],
      levelScores: body.levelScores || {},
      totalScore: Number(body.totalScore) || 0,
      badges: body.badges || []
    };

    const filter: any = studentId
      ? { $or: [{ studentId }, { studentName: studentName.trim(), className: className.trim() }] }
      : { studentName: studentName.trim(), className: className.trim() };

    const saved = await ExcelAdventureStudentResult.findOneAndUpdate(
      filter,
      { $set: updatePayload },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: saved
    });
  } catch (error: any) {
    console.error('API Error saving Excel Adventure result:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
