import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import { TeacherProfile } from '@/models/Profile';
import { StudentAttendance } from '@/models/StudentAttendance';
import * as xlsx from 'xlsx';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'date', 'month', 'year'
    const value = searchParams.get('value'); // YYYY-MM-DD, YYYY-MM, or YYYY

    await connectDB();
    const teacher = await TeacherProfile.findOne({ userId: session.user.id });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    let query: any = { teacherId: teacher._id };

    if (filter === 'date' && value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      query.date = { $gte: date, $lt: nextDate };
    } else if (filter === 'month' && value) {
      // value format: YYYY-MM
      const [yearStr, monthStr] = value.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 0-indexed
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);
      query.date = { $gte: startDate, $lt: endDate };
    } else if (filter === 'year' && value) {
      // value format: YYYY
      const year = parseInt(value, 10);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const attendances = await StudentAttendance.find(query)
      .populate('classId', 'name')
      .populate('records.studentId', 'fullName studentNumber')
      .lean();

    const data: any[] = [];
    
    attendances.forEach((att: any) => {
      const className = att.classId?.name || 'Unknown Class';
      const dateStr = att.date ? new Date(att.date).toLocaleDateString('id-ID') : '';
      
      att.records?.forEach((record: any) => {
        data.push({
          'Tanggal': dateStr,
          'Kelas': className,
          'NIS': record.studentId?.studentNumber || '-',
          'Nama Siswa': record.studentId?.fullName || 'Unknown Student',
          'Status Kehadiran': record.status || 'HADIR'
        });
      });
    });

    if (data.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data absensi untuk filter tersebut' }, { status: 404 });
    }

    // Sort by date then class
    data.sort((a, b) => {
      if (a.Tanggal !== b.Tanggal) return a.Tanggal.localeCompare(b.Tanggal);
      return a.Kelas.localeCompare(b.Kelas);
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 15 }, // Tanggal
      { wch: 15 }, // Kelas
      { wch: 20 }, // NIS
      { wch: 30 }, // Nama Siswa
      { wch: 15 }  // Status Kehadiran
    ];
    worksheet['!cols'] = colWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Absensi');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Absensi_${filter}_${value || 'semua'}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
