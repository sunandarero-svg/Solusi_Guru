import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { TeacherProfile, StudentProfile } from '@/models/Profile';
import { Class, TeacherClass, Enrollment } from '@/models/Class';
import { ExcelAdventureConfig } from '@/models/ExcelAdventure';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Ambil konfigurasi Excel Adventure dari database
    let config = await ExcelAdventureConfig.findOne().lean();
    if (!config) {
      config = {
        assignedClassIds: [],
        assignedClassNames: [],
        kkmScore: 75,
        activeLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        instructions: 'Selesaikan seluruh misi dan latihan spreadsheet sesuai petunjuk guru.',
        allowReplay: true
      };
    }

    const role = session.user.role;

    // 1. JIKA PENGGUNA ADALAH GURU ATAU ADMIN
    if (role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL') {
      let teacherClasses: { id: string; name: string }[] = [];

      if (role === 'TEACHER') {
        const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
        if (teacher) {
          const links = await TeacherClass.find({ teacherId: teacher._id })
            .populate('classId')
            .lean();

          const uniqueClasses = new Map<string, string>();
          links.forEach((l: any) => {
            if (l.classId && l.classId._id) {
              uniqueClasses.set(l.classId._id.toString(), l.classId.name || 'Kelas');
            }
          });

          teacherClasses = Array.from(uniqueClasses.entries()).map(([id, name]) => ({
            id,
            name
          }));
        }
      } else {
        // Admin / Principal: ambil seluruh kelas
        const allClasses = await Class.find().lean();
        teacherClasses = allClasses.map((c: any) => ({
          id: c._id.toString(),
          name: c.name
        }));
      }

      return NextResponse.json({
        success: true,
        isTeacher: true,
        role,
        teacherClasses,
        config
      });
    }

    // 2. JIKA PENGGUNA ADALAH SISWA
    const student = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!student) {
      return NextResponse.json({
        success: true,
        isTeacher: false,
        isAssigned: false,
        studentClassName: 'Belum Terdaftar Kelas',
        config
      });
    }

    const enrollments = await Enrollment.find({ studentId: student._id })
      .populate('classId')
      .lean();

    const studentClassIds = enrollments.map((e: any) => e.classId?._id?.toString()).filter(Boolean);
    const studentClassNames = enrollments.map((e: any) => e.classId?.name).filter(Boolean);
    const primaryClassName = studentClassNames[0] || 'Kelas Siswa';

    // Cek apakah ada classId atau className siswa yang cocok dengan assignedClassIds / assignedClassNames
    const assignedIds: string[] = config.assignedClassIds || [];
    const assignedNames: string[] = (config.assignedClassNames || []).map((n: string) =>
      n.toLowerCase().trim()
    );

    const isAssigned =
      studentClassIds.some((id: string) => assignedIds.includes(id)) ||
      studentClassNames.some((name: string) => assignedNames.includes(name.toLowerCase().trim()));

    return NextResponse.json({
      success: true,
      isTeacher: false,
      role: 'STUDENT',
      studentClassName: primaryClassName,
      isAssigned,
      assignedClassNames: config.assignedClassNames || [],
      kkmScore: config.kkmScore || 75,
      activeLevels: config.activeLevels || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya guru yang dapat menugaskan game ke kelas.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Existing config
    const existingConfig = await ExcelAdventureConfig.findOne().lean();
    const currentAssignedIds: string[] = existingConfig?.assignedClassIds || [];

    let updatedAssignedIds: string[] = [];

    if (role === 'TEACHER') {
      const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
      if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

      const teacherClasses = await TeacherClass.find({ teacherId: teacher._id }).lean();
      const myClassIdStrings = teacherClasses.map((tc: any) => tc.classId.toString());

      // Kelas milik guru lain tetap dipertahankan
      const otherTeachersClassIds = currentAssignedIds.filter((id: string) => !myClassIdStrings.includes(id));

      // Kelas yang dicentang oleh guru ini
      const mySelectedIds = (body.assignedClassIds || []).filter((id: string) => myClassIdStrings.includes(id));

      updatedAssignedIds = Array.from(new Set([...otherTeachersClassIds, ...mySelectedIds]));
    } else {
      // Admin / Principal dapat mengatur seluruh kelas
      updatedAssignedIds = body.assignedClassIds || [];
    }

    // Ambil nama kelas langsung dari database Class
    const assignedClasses = await Class.find({ _id: { $in: updatedAssignedIds } }).lean();
    const assignedClassNames = assignedClasses.map((c: any) => c.name);

    const updatePayload = {
      assignedClassIds: updatedAssignedIds,
      assignedClassNames: assignedClassNames,
      kkmScore: Number(body.kkmScore) || existingConfig?.kkmScore || 75,
      activeLevels: body.activeLevels || existingConfig?.activeLevels || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      instructions:
        body.instructions !== undefined
          ? body.instructions
          : (existingConfig?.instructions || 'Selesaikan seluruh misi spreadsheet.'),
      allowReplay: body.allowReplay !== undefined ? Boolean(body.allowReplay) : true,
      updatedBy: session.user.name || 'Guru'
    };

    const updated = await ExcelAdventureConfig.findOneAndUpdate(
      {},
      { $set: updatePayload },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
