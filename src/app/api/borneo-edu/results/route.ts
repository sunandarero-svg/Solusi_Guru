import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduStudentResult } from '@/models/BorneoEdu';

export async function GET(req: NextRequest) {
  try {
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        message: 'No MongoDB URI configured. Using browser localStorage mode.',
        data: []
      });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const className = searchParams.get('className');
    const subject = searchParams.get('subject');

    const query: any = {};
    if (className) query.className = className;
    if (subject) query.subject = subject;

    const results = await BorneoEduStudentResult.find(query)
      .sort({ finalScore: -1, totalScore: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      mode: 'database',
      data: results
    });
  } catch (error: any) {
    console.error('API Error fetching Borneo Edu results:', error);
    return NextResponse.json({
      success: false,
      mode: 'local',
      error: error.message || 'Database connection error',
      data: []
    }, { status: 200 }); // Graceful fallback
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
        message: 'Saved locally in browser.',
        data: body
      });
    }

    await dbConnect();

    const {
      studentName,
      studentNumber,
      className,
      subject,
      materi,
      highestLevel,
      completedLevels,
      completedWorlds,
      totalScore,
      totalCoins,
      correctCount,
      wrongCount,
      totalQuestions,
      accuracy,
      highestCombo,
      bossesDefeated,
      badges,
      finalScore,
      gameStatus,
      questionHistory,
      checkpointData
    } = body;

    if (!studentName) {
      return NextResponse.json({ success: false, error: 'Student name is required' }, { status: 400 });
    }

    const filter = {
      studentName: studentName.trim(),
      studentNumber: (studentNumber || '-').trim()
    };

    const update = {
      studentName: studentName.trim(),
      studentNumber: (studentNumber || '-').trim(),
      className: className || 'Kelas 7',
      subject: subject || 'Informatika & Sains',
      materi: materi || 'Petualangan Borneo Edu',
      highestLevel: highestLevel || 1,
      completedLevels: completedLevels || [],
      completedWorlds: completedWorlds || 0,
      totalScore: totalScore || 0,
      totalCoins: totalCoins || 0,
      correctCount: correctCount || 0,
      wrongCount: wrongCount || 0,
      totalQuestions: totalQuestions || 0,
      accuracy: accuracy || 0,
      highestCombo: highestCombo || 0,
      bossesDefeated: bossesDefeated || 0,
      badges: badges || [],
      finalScore: finalScore || 0,
      gameStatus: gameStatus || 'Sedang Berjalan',
      ...(questionHistory ? { questionHistory } : {}),
      ...(checkpointData ? { checkpointData } : {})
    };

    const saved = await BorneoEduStudentResult.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      mode: 'database',
      data: saved
    });
  } catch (error: any) {
    console.error('API Error saving Borneo Edu result:', error);
    return NextResponse.json({
      success: false,
      mode: 'local',
      error: error.message || 'Database write error'
    }, { status: 200 }); // Graceful fallback to avoid breaking gameplay
  }
}
