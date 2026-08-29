import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import { TeacherProfile } from '@/models/Profile';
import { StudentAttendance } from '@/models/StudentAttendance';

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
    const { classId, date, records } = body;

    if (!classId || !date || !records) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await StudentAttendance.findOne({
      classId,
      date: attendanceDate,
      teacherId: teacher._id
    });

    if (attendance) {
      attendance.records = records;
      await attendance.save();
    } else {
      attendance = await StudentAttendance.create({
        teacherId: teacher._id,
        classId,
        date: attendanceDate,
        records
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error saving attendance:', error);
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

    const attendanceDate = new Date(dateParam);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await StudentAttendance.findOne({
      classId,
      date: attendanceDate,
      teacherId: teacher._id
    });

    return NextResponse.json(attendance || { records: [] });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
