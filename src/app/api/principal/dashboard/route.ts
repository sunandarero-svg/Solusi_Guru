import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import { TeacherJournal } from '@/models/TeacherJournal';
import { TeacherProfile } from '@/models/Profile';
import { Class } from '@/models/Class';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PRINCIPAL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    await connectDB();

    const targetDate = new Date(dateParam);
    targetDate.setHours(0, 0, 0, 0);

    const journals = await TeacherJournal.find({ date: targetDate })
      .populate({ path: 'teacherId', model: TeacherProfile })
      .populate({ path: 'classId', model: Class })
      .exec();

    let totalPresent = 0;
    let totalAbsent = 0;
    const records = [];

    for (const journal of journals) {
      if (journal.attendanceStatus === 'HADIR') {
        totalPresent++;
      } else {
        totalAbsent++;
      }

      records.push({
        teacherName: journal.teacherId.fullName,
        className: journal.classId.name,
        status: journal.attendanceStatus,
        topic: journal.topic
      });
    }

    return NextResponse.json({
      summary: {
        totalPresent,
        totalAbsent,
        totalRecords: records.length
      },
      records
    });
  } catch (error) {
    console.error('Error fetching principal dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
