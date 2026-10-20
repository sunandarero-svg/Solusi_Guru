import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { BorneoEduStudentResult, BorneoEduConfig } from '@/models/BorneoEdu';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherPin, target = 'all', studentName, resultId, studentId, className } = body;

    const session = await getServerSession(authOptions);
    const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN' || session?.user?.role === 'PRINCIPAL';

    await dbConnect();
    const config = await BorneoEduConfig.findOne().lean();
    const validPin = config?.teacherPin || 'guru123';

    // Jika bukan sesi guru terautentikasi, wajib menyertakan PIN guru yang valid
    if (!isTeacher && teacherPin !== validPin) {
      return NextResponse.json({ success: false, error: 'Akses ditolak: PIN Guru salah atau sesi tidak valid' }, { status: 403 });
    }

    const resetFields = {
      highestLevel: 1,
      completedLevels: [],
      completedWorlds: 0,
      totalScore: 0,
      totalCoins: 0,
      correctCount: 0,
      wrongCount: 0,
      totalQuestions: 0,
      accuracy: 0,
      highestCombo: 0,
      bossesDefeated: 0,
      badges: [],
      finalScore: 0,
      checkpointData: null,
      gameStatus: 'Sedang Berjalan',
      lastResetAt: new Date()
    };

    // 1. Reset Per Siswa
    if (target === 'student') {
      const query: any = {};
      if (resultId) query._id = resultId;
      else if (studentId) query.studentId = studentId;
      else if (studentName) query.studentName = studentName.trim();
      else {
        return NextResponse.json({ success: false, error: 'Nama atau ID siswa wajib disertakan.' }, { status: 400 });
      }

      const updated = await BorneoEduStudentResult.findOneAndUpdate(
        query,
        { $set: resetFields },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        target: 'student',
        message: `Progres siswa ${studentName || 'yang dipilih'} berhasil direset ke Level 1.`,
        data: updated
      });
    }

    // 2. Reset Per Kelas
    if (target === 'class') {
      if (!className) {
        return NextResponse.json({ success: false, error: 'Nama kelas wajib disertakan.' }, { status: 400 });
      }

      const res = await BorneoEduStudentResult.updateMany(
        { className: { $regex: new RegExp(`^${className.trim()}$`, 'i') } },
        { $set: resetFields }
      );

      return NextResponse.json({
        success: true,
        target: 'class',
        className,
        message: `Seluruh progres siswa di ${className} berhasil direset ke Level 1 (${res.modifiedCount} siswa).`
      });
    }

    // 3. Reset Seluruh Data (All)
    await BorneoEduStudentResult.updateMany({}, { $set: resetFields });

    return NextResponse.json({
      success: true,
      target: 'all',
      message: 'Seluruh rekap data progres siswa Borneo Edu berhasil direset ke Level 1.'
    });
  } catch (error: any) {
    console.error('API Error resetting Borneo Edu:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
