import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduStudentResult, BorneoEduConfig } from '@/models/BorneoEdu';

export async function POST(req: NextRequest) {
  try {
    const { teacherPin } = await req.json();

    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      if (teacherPin !== 'guru123') {
        return NextResponse.json({ success: false, error: 'PIN Guru salah' }, { status: 403 });
      }
      return NextResponse.json({ success: true, mode: 'local' });
    }

    await dbConnect();
    const config = await BorneoEduConfig.findOne().lean();
    const validPin = config?.teacherPin || 'guru123';

    if (teacherPin !== validPin) {
      return NextResponse.json({ success: false, error: 'PIN Guru salah' }, { status: 403 });
    }

    await BorneoEduStudentResult.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Seluruh rekap data siswa berhasil direset.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
