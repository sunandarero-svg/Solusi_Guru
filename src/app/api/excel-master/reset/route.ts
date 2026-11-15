import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { ExcelMasterStudentResult } from '@/models/ExcelMasterChallenge';
import { getAuthSession } from '@/modules/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Hanya guru yang berhak mereset progres siswa untuk remedial.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await req.json();
    const { resultId, resetAll } = body;

    if (resetAll) {
      await ExcelMasterStudentResult.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'Seluruh riwayat hasil permainan siswa berhasil direset.'
      });
    }

    if (!resultId) {
      return NextResponse.json(
        { error: 'Parameter resultId diperlukan untuk reset per siswa.' },
        { status: 400 }
      );
    }

    const deleted = await ExcelMasterStudentResult.findByIdAndDelete(resultId);
    if (!deleted) {
      return NextResponse.json({ error: 'Data hasil siswa tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Progres siswa ${deleted.studentName} berhasil direset untuk remedial.`
    });
  } catch (error: any) {
    console.error('Error resetting student result:', error);
    return NextResponse.json(
      { error: 'Gagal mereset hasil siswa', details: error.message },
      { status: 500 }
    );
  }
}
