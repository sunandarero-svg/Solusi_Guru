import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { ExcelMasterStudentResult, ExcelMasterConfig } from '@/models/ExcelMasterChallenge';
import { getAuthSession } from '@/modules/auth/session';
import { EXCEL_QUESTIONS } from '@/modules/excel-master/data/questions';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const className = url.searchParams.get('className') || '';
    const format = url.searchParams.get('format') || 'json';

    const session = await getAuthSession();
    const role = session?.user?.role;
    const isTeacher = role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL';

    // Build filter
    const query: any = {};
    if (search) {
      query.studentName = { $regex: search, $options: 'i' };
    }
    if (className && className !== 'ALL') {
      query.className = className;
    }

    const results = await ExcelMasterStudentResult.find(query)
      .sort({ totalScore: -1, accuracy: -1, updatedAt: -1 })
      .lean();

    // If CSV requested (only for teachers/admins)
    if (format === 'csv') {
      if (!isTeacher) {
        return NextResponse.json({ error: 'Unauthorized to download CSV' }, { status: 403 });
      }

      // Generate Excel-friendly CSV with UTF-8 BOM
      const headers = [
        'No',
        'Nama Siswa',
        'Kelas',
        'Level Tertinggi',
        'Total Skor (0-5000)',
        'Jawaban Benar',
        'Jawaban Salah',
        'Akurasi (%)',
        'Gelar Diperoleh',
        'Medali',
        'Waktu Pengerjaan (Detik)',
        'Status Selesai',
        'Tanggal Pengerjaan'
      ];

      const csvRows = results.map((r: any, idx: number) => [
        idx + 1,
        `"${(r.studentName || '').replace(/"/g, '""')}"`,
        `"${(r.className || '').replace(/"/g, '""')}"`,
        r.highestLevel || 1,
        r.totalScore || 0,
        r.correctCount || 0,
        r.wrongCount || 0,
        `${(r.accuracy || 0).toFixed(1)}%`,
        `"${r.titleAwarded || 'EXCEL BEGINNER'}"`,
        `"${(r.medals || []).join(', ')}"`,
        r.totalTimeSeconds || 0,
        r.isCompleted ? 'SELESAI (50 Soal)' : 'DALAM PROSES',
        r.updatedAt ? new Date(r.updatedAt).toLocaleString('id-ID') : '-'
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\r\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Rekap_Excel_Master_Challenge_${Date.now()}.csv"`
        }
      });
    }

    // Question analytics: Compute most missed questions
    const questionStatsMap = new Map<
      number,
      { totalAttempts: number; wrongAttempts: number; correctAttempts: number }
    >();

    results.forEach((r: any) => {
      if (Array.isArray(r.questionHistory)) {
        r.questionHistory.forEach((q: any) => {
          const qId = q.questionId;
          const current = questionStatsMap.get(qId) || {
            totalAttempts: 0,
            wrongAttempts: 0,
            correctAttempts: 0
          };
          current.totalAttempts += 1;
          if (q.isCorrect) {
            current.correctAttempts += 1;
          } else {
            current.wrongAttempts += 1;
          }
          questionStatsMap.set(qId, current);
        });
      }
    });

    const questionAnalytics = EXCEL_QUESTIONS.map((q: any) => {
      const stats = questionStatsMap.get(q.id) || {
        totalAttempts: 0,
        wrongAttempts: 0,
        correctAttempts: 0
      };
      const errorRate =
        stats.totalAttempts > 0
          ? Math.round((stats.wrongAttempts / stats.totalAttempts) * 100)
          : 0;

      return {
        id: q.id,
        level: q.level,
        theme: q.theme,
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        totalAttempts: stats.totalAttempts,
        wrongAttempts: stats.wrongAttempts,
        errorRate
      };
    })
      .filter((q: any) => q.totalAttempts > 0)
      .sort((a: any, b: any) => b.errorRate - a.errorRate || b.wrongAttempts - a.wrongAttempts);

    // Summary statistics
    const totalStudents = results.length;
    const avgScore =
      totalStudents > 0
        ? Math.round(results.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalStudents)
        : 0;
    const completedStudents = results.filter((r) => r.isCompleted).length;
    const completionRate =
      totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

    return NextResponse.json({
      success: true,
      results,
      questionAnalytics,
      stats: {
        totalStudents,
        avgScore,
        completedStudents,
        completionRate
      }
    });
  } catch (error: any) {
    console.error('Error fetching Excel Master results:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap hasil Excel Master', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      studentName,
      className,
      highestLevel,
      unlockedLevels,
      totalScore,
      correctCount,
      wrongCount,
      accuracy,
      totalTimeSeconds,
      titleAwarded,
      medals,
      levelStats,
      questionHistory,
      isCompleted
    } = body;

    if (!studentName) {
      return NextResponse.json({ error: 'Nama siswa wajib diisi' }, { status: 400 });
    }

    const session = await getAuthSession();
    let studentId = undefined;
    if (session?.user?.id) {
      studentId = session.user.id;
    }

    // Find if student result already exists
    // Search by studentName + className (or studentId if logged in)
    let record = null;
    if (studentId) {
      record = await ExcelMasterStudentResult.findOne({ studentId });
    }
    if (!record) {
      record = await ExcelMasterStudentResult.findOne({
        studentName: studentName.trim(),
        className: (className || 'Kelas Siswa').trim()
      });
    }

    if (!record) {
      record = new ExcelMasterStudentResult({
        studentId,
        studentName: studentName.trim(),
        className: (className || 'Kelas Siswa').trim()
      });
    }

    // Check if configuration allows replay
    const config = await ExcelMasterConfig.findOne().lean();
    if (record.isCompleted && config && !config.allowReplay && !isCompleted) {
      return NextResponse.json(
        {
          error:
            'Guru telah mengunci pengerjaan ulang setelah game diselesaikan. Hubungi guru jika ingin perbaikan/remedial.'
        },
        { status: 403 }
      );
    }

    // Update record
    record.highestLevel = Math.max(record.highestLevel || 1, highestLevel || 1);
    record.unlockedLevels = Array.from(
      new Set([...(record.unlockedLevels || [1]), ...(unlockedLevels || [1])])
    );
    record.totalScore = totalScore || 0;
    record.correctCount = correctCount || 0;
    record.wrongCount = wrongCount || 0;
    record.accuracy = accuracy || 0;
    record.totalTimeSeconds = totalTimeSeconds || 0;
    record.titleAwarded = titleAwarded || 'EXCEL BEGINNER';
    record.medals = medals || [];
    record.levelStats = levelStats || {};
    if (Array.isArray(questionHistory)) {
      record.questionHistory = questionHistory;
    }
    if (isCompleted) {
      record.isCompleted = true;
      record.completedAt = new Date();
    }

    await record.save();

    return NextResponse.json({
      success: true,
      message: 'Perkembangan permainan berhasil disimpan.',
      result: record
    });
  } catch (error: any) {
    console.error('Error saving Excel Master result:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan perkembangan permainan', details: error.message },
      { status: 500 }
    );
  }
}
