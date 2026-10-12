import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduQuestion } from '@/models/BorneoEdu';
import { DEFAULT_QUESTIONS } from '@/modules/borneo-edu/defaultQuestions';

export async function GET(req: NextRequest) {
  try {
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'default',
        count: DEFAULT_QUESTIONS.length,
        data: DEFAULT_QUESTIONS
      });
    }

    await dbConnect();
    const dbQuestions = await BorneoEduQuestion.find().sort({ level: 1 }).lean();

    if (dbQuestions && dbQuestions.length > 0) {
      return NextResponse.json({
        success: true,
        mode: 'database',
        count: dbQuestions.length,
        data: dbQuestions
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'default',
      count: DEFAULT_QUESTIONS.length,
      data: DEFAULT_QUESTIONS
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
