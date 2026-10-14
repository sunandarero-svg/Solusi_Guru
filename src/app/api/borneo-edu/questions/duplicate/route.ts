import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { BorneoEduQuestion } from '@/models/BorneoEdu';
import mongoose from 'mongoose';

// POST: Duplikasi soal ke kelas lain
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.json({ success: false, error: 'Akses khusus Guru dan Administrator' }, { status: 403 });
    }

    const body = await req.json();
    const { questionIds, targetClassId, targetClassName } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Pilih minimal satu soal untuk diduplikasi' }, { status: 400 });
    }

    if (!targetClassId || !targetClassName) {
      return NextResponse.json({ success: false, error: 'Kelas tujuan wajib dipilih' }, { status: 400 });
    }

    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        message: `${questionIds.length} soal berhasil diduplikasi ke ${targetClassName} (mode lokal).`,
        count: questionIds.length
      });
    }

    await dbConnect();

    // Ambil data soal yang akan diduplikasi
    const sourceQuestions = await BorneoEduQuestion.find({
      questionId: { $in: questionIds }
    }).lean();

    if (!sourceQuestions || sourceQuestions.length === 0) {
      return NextResponse.json({ success: false, error: 'Soal sumber tidak ditemukan' }, { status: 404 });
    }

    const isGeneral = targetClassId === 'all' || targetClassId === 'general';
    const cleanClassId = isGeneral
      ? null
      : mongoose.Types.ObjectId.isValid(targetClassId)
      ? new mongoose.Types.ObjectId(targetClassId)
      : targetClassId;
    const cleanClassName = isGeneral ? null : targetClassName;

    const newDocuments = sourceQuestions.map((q: any, idx: number) => {
      const classTag = isGeneral ? 'GEN' : targetClassName.replace(/[^a-zA-Z0-9]/g, '');
      const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}_${idx + 1}`;
      const newQuestionId = `Q_W${q.world}_L${q.level}_${classTag}_${uniqueSuffix}`;

      return {
        questionId: newQuestionId,
        world: q.world,
        level: q.level,
        question: q.question,
        options: { ...q.options },
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        explanation: q.explanation,
        stage: q.stage || 'Pengetahuan',
        isBossQuestion: !!q.isBossQuestion,
        isActive: true, // Default aktif saat diduplikasi
        classId: cleanClassId,
        className: cleanClassName,
        materialId: q.materialId || null
      };
    });

    const inserted = await BorneoEduQuestion.insertMany(newDocuments);

    return NextResponse.json({
      success: true,
      message: `${inserted.length} butir soal berhasil diduplikasi ke kelas ${targetClassName}!`,
      count: inserted.length,
      data: inserted
    });
  } catch (error: any) {
    console.error('Error duplicating questions to class:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menduplikasi soal' }, { status: 500 });
  }
}
