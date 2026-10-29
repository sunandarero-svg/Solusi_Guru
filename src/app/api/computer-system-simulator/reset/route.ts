import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { ComputerSystemSimulatorStudentResult } from '@/models/ComputerSystemSimulator';
import { BorneoEduConfig } from '@/models/BorneoEdu';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherPin, target = 'all', studentName, resultId, studentId, className } = body;

    const session = await getServerSession(authOptions);
    const isTeacher =
      session?.user?.role === 'TEACHER' ||
      session?.user?.role === 'ADMIN' ||
      session?.user?.role === 'PRINCIPAL';

    await dbConnect();
    const config = await BorneoEduConfig.findOne().lean();
    const validPin = config?.teacherPin || 'guru123';

    // Jika bukan sesi guru terautentikasi, verifikasi PIN Guru
    if (!isTeacher && teacherPin !== validPin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: PIN Guru salah atau sesi tidak valid' },
        { status: 403 }
      );
    }

    const resetFields = {
      highestLevel: 1,
      unlockedLevels: [1],
      levelScores: {},
      totalScore: 0,
      badges: [],
      lastResetAt: new Date()
    };

    // 1. Reset Per Siswa
    if (target === 'student') {
      const query: any = {};
      if (resultId) query._id = resultId;
      else if (studentId) query.studentId = studentId;
      else if (studentName) query.studentName = { $regex: new RegExp(`^${studentName.trim()}$`, 'i') };
      else {
        return NextResponse.json(
          { success: false, error: 'Nama atau ID siswa wajib disertakan.' },
          { status: 400 }
        );
      }

      const updated = await ComputerSystemSimulatorStudentResult.findOneAndUpdate(
        query,
        { $set: resetFields },
        { returnDocument: 'after' }
      );

      return NextResponse.json({
        success: true,
        target: 'student',
        message: `Progres Simulator Sistem Komputer siswa ${studentName || 'yang dipilih'} berhasil direset ke Level 1.`,
        data: updated
      });
    }

    // 2. Reset Per Kelas
    if (target === 'class') {
      if (!className) {
        return NextResponse.json({ success: false, error: 'Nama kelas wajib disertakan.' }, { status: 400 });
      }

      const res = await ComputerSystemSimulatorStudentResult.updateMany(
        { className: { $regex: new RegExp(`^${className.trim()}$`, 'i') } },
        { $set: resetFields }
      );

      return NextResponse.json({
        success: true,
        target: 'class',
        className,
        message: `Seluruh progres siswa Simulator Sistem Komputer di ${className} berhasil direset ke Level 1 (${res.modifiedCount} siswa).`
      });
    }

    // 3. Reset Seluruh Data (All)
    await ComputerSystemSimulatorStudentResult.updateMany({}, { $set: resetFields });

    return NextResponse.json({
      success: true,
      target: 'all',
      message: 'Seluruh rekap data progres siswa Simulator Sistem Komputer berhasil direset ke Level 1.'
    });
  } catch (error: any) {
    console.error('API Error resetting Computer System Simulator:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

