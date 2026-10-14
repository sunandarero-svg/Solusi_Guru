import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduQuestion, BorneoEduConfig } from '@/models/BorneoEdu';
import { DEFAULT_QUESTIONS } from '@/modules/borneo-edu/defaultQuestions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const worldParam = searchParams.get('world');
    const levelParam = searchParams.get('level');
    const diffParam = searchParams.get('difficulty');
    const classIdParam = searchParams.get('classId');
    const activeOnly = searchParams.get('activeOnly'); // 'true' = hanya soal aktif (untuk game siswa)

    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      let filtered = DEFAULT_QUESTIONS;
      if (worldParam && worldParam !== 'all') {
        filtered = filtered.filter((q) => q.world === Number(worldParam));
      }
      if (levelParam && levelParam !== 'all') {
        filtered = filtered.filter((q) => q.level === Number(levelParam));
      }
      if (diffParam && diffParam !== 'all') {
        filtered = filtered.filter((q) => q.difficulty === diffParam);
      }
      return NextResponse.json({
        success: true,
        mode: 'default',
        count: filtered.length,
        data: filtered
      });
    }

    await dbConnect();
    const filterQuery: any = {};
    if (worldParam && worldParam !== 'all') {
      filterQuery.world = Number(worldParam);
    }
    if (levelParam && levelParam !== 'all') {
      filterQuery.level = Number(levelParam);
    }
    if (diffParam && diffParam !== 'all') {
      filterQuery.difficulty = diffParam;
    }

    // Jika activeOnly=true, pastikan hanya mengambil soal aktif
    if (activeOnly === 'true') {
      filterQuery.isActive = { $ne: false };
    }

    // Ambil config guru jika activeOnly=true untuk filter scope soal & level
    let teacherConfig: any = null;
    if (activeOnly === 'true') {
      try {
        teacherConfig = await BorneoEduConfig.findOne().lean();
      } catch (_) {}
    }

    // Helper untuk memfilter soal berdasarkan config guru
    const applyTeacherConfigFilter = (questionsList: any[]) => {
      if (!teacherConfig || activeOnly !== 'true') return questionsList;
      const start = teacherConfig.activeLevelStart || 1;
      const end = teacherConfig.activeLevelEnd || 25;
      const maxPerLevel = teacherConfig.maxQuestionsPerLevel || 4;

      // Filter level aktif
      let result = questionsList.filter((q: any) => q.level >= start && q.level <= end);

      // Batasi soal per level
      if (maxPerLevel < 4) {
        const grouped: Record<number, any[]> = {};
        for (const q of result) {
          if (!grouped[q.level]) grouped[q.level] = [];
          grouped[q.level].push(q);
        }
        result = [];
        for (const level of Object.keys(grouped).map(Number).sort((a, b) => a - b)) {
          result.push(...grouped[level].slice(0, maxPerLevel));
        }
      }
      return result;
    };

    // Jika ada parameter classId, periksa apakah kelas tersebut memiliki soal khusus yang digenerate oleh guru
    if (classIdParam && classIdParam !== 'all') {
      const classFilter: any = {
        ...filterQuery,
        classId: classIdParam,
      };

      const classQuestions = await BorneoEduQuestion.find(classFilter)
        .sort({ world: 1, level: 1 }).lean();

      if (classQuestions && classQuestions.length > 0) {
        const filteredQuestions = applyTeacherConfigFilter(classQuestions);
        return NextResponse.json({
          success: true,
          mode: 'class-specific',
          count: filteredQuestions.length,
          data: filteredQuestions,
        });
      }
    }

    const dbQuestions = await BorneoEduQuestion.find(filterQuery).sort({ world: 1, level: 1 }).lean();

    if (dbQuestions && dbQuestions.length > 0) {
      const filteredDbQuestions = applyTeacherConfigFilter(dbQuestions);
      return NextResponse.json({
        success: true,
        mode: 'database',
        count: filteredDbQuestions.length,
        data: filteredDbQuestions
      });
    }

    // If DB is empty, initialize with default questions if no specific filter
    if (Object.keys(filterQuery).length === 0) {
      try {
        const ops = DEFAULT_QUESTIONS.map((q) => ({
          updateOne: {
            filter: { questionId: q.questionId },
            update: { $set: { ...q, isActive: true } },
            upsert: true
          }
        }));
        await BorneoEduQuestion.bulkWrite(ops);
        const initialized = await BorneoEduQuestion.find().sort({ world: 1, level: 1 }).lean();
        const filteredInit = applyTeacherConfigFilter(initialized);
        return NextResponse.json({
          success: true,
          mode: 'database-seeded',
          count: filteredInit.length,
          data: filteredInit
        });
      } catch (_) {}
    }

    let defaultFiltered = DEFAULT_QUESTIONS;
    if (activeOnly === 'true') {
      defaultFiltered = applyTeacherConfigFilter(DEFAULT_QUESTIONS);
    }
    return NextResponse.json({
      success: true,
      mode: 'default',
      count: defaultFiltered.length,
      data: defaultFiltered
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      mode: 'fallback',
      count: DEFAULT_QUESTIONS.length,
      data: DEFAULT_QUESTIONS
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;

    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        message: 'Questions accepted for local storage update.',
        count: Array.isArray(body) ? body.length : 1
      });
    }

    await dbConnect();

    if (Array.isArray(body)) {
      // Bulk insert/upsert
      const ops = body.map((q) => ({
        updateOne: {
          filter: { questionId: q.questionId },
          update: { $set: q },
          upsert: true
        }
      }));
      await BorneoEduQuestion.bulkWrite(ops);
      return NextResponse.json({ success: true, count: body.length });
    } else {
      const saved = await BorneoEduQuestion.findOneAndUpdate(
        { questionId: body.questionId },
        { $set: body },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, data: saved });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds, updates, replaceAll, questions } = body;

    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        message: 'Bulk updates accepted.'
      });
    }

    await dbConnect();

    if (replaceAll && Array.isArray(questions)) {
      // Replace entire bank soal
      await BorneoEduQuestion.deleteMany({});
      const ops = questions.map((q: any) => ({
        updateOne: {
          filter: { questionId: q.questionId },
          update: { $set: q },
          upsert: true
        }
      }));
      await BorneoEduQuestion.bulkWrite(ops);
      return NextResponse.json({ success: true, count: questions.length, message: 'Seluruh bank soal berhasil diperbarui.' });
    }

    if (Array.isArray(questionIds) && questionIds.length > 0 && updates) {
      // Bulk update specific fields on selected questions
      const result = await BorneoEduQuestion.updateMany(
        { questionId: { $in: questionIds } },
        { $set: updates }
      );
      return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
    }

    return NextResponse.json({ success: false, error: 'Data update tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');

    let bodyQuestionIds: string[] = [];
    try {
      const body = await req.json();
      if (body && Array.isArray(body.questionIds)) {
        bodyQuestionIds = body.questionIds;
      } else if (body && body.questionId) {
        bodyQuestionIds = [body.questionId];
      }
    } catch (_) {}

    const targetIds = bodyQuestionIds.length > 0 ? bodyQuestionIds : queryId ? [queryId] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ success: false, error: 'ID Soal tidak diberikan' }, { status: 400 });
    }

    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        deletedCount: targetIds.length,
        deletedIds: targetIds
      });
    }

    await dbConnect();
    const result = await BorneoEduQuestion.deleteMany({
      questionId: { $in: targetIds }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      deletedIds: targetIds
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
