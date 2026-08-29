import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import { TeacherProfile } from '@/models/Profile';
import { TeacherJournal } from '@/models/TeacherJournal';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await TeacherProfile.findOne({ userId: session.user.id });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { classId, date, attendanceStatus, topic, description } = body;

    if (!classId || !date || !attendanceStatus || !topic || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const journalDate = new Date(date);
    journalDate.setHours(0, 0, 0, 0);

    let journal = await TeacherJournal.findOne({
      classId,
      date: journalDate,
      teacherId: teacher._id
    });

    if (journal) {
      journal.attendanceStatus = attendanceStatus;
      journal.topic = topic;
      journal.description = description;
      await journal.save();
    } else {
      journal = await TeacherJournal.create({
        teacherId: teacher._id,
        classId,
        date: journalDate,
        attendanceStatus,
        topic,
        description
      });
    }

    return NextResponse.json(journal);
  } catch (error) {
    console.error('Error saving journal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const dateParam = searchParams.get('date');

    if (!classId || !dateParam) {
      return NextResponse.json({ error: 'Missing classId or date' }, { status: 400 });
    }

    await connectDB();
    const teacher = await TeacherProfile.findOne({ userId: session.user.id });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const journalDate = new Date(dateParam);
    journalDate.setHours(0, 0, 0, 0);

    const journal = await TeacherJournal.findOne({
      classId,
      date: journalDate,
      teacherId: teacher._id
    });

    return NextResponse.json(journal || null);
  } catch (error) {
    console.error('Error fetching journal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
