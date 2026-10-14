import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduQuestion } from '@/models/BorneoEdu';

// PATCH: Toggle isActive status untuk satu atau banyak soal
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds, isActive } = body;

    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        message: 'Perubahan status soal diterima (mode lokal).'
      });
    }

    await dbConnect();

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ success: false, error: 'questionIds harus berupa array yang tidak kosong.' }, { status: 400 });
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isActive harus bertipe boolean.' }, { status: 400 });
    }

    const result = await BorneoEduQuestion.updateMany(
      { questionId: { $in: questionIds } },
      { $set: { isActive } }
    );

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} soal berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
