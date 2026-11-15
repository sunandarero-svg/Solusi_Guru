import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { ExcelMasterConfig } from '@/models/ExcelMasterChallenge';
import { getAuthSession } from '@/modules/auth/session';
import User from '@/models/User';
import { StudentProfile } from '@/models/Profile';
import { Enrollment } from '@/models/Class';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    let config = await ExcelMasterConfig.findOne().lean();
    if (!config) {
      // Create initial default config
      config = await ExcelMasterConfig.create({
        isLocked: false,
        lockMessage: 'Game Excel Master Challenge sedang ditutup sementara oleh guru.',
        assignmentMode: 'ALL',
        assignedClassIds: [],
        assignedClassNames: [],
        assignedStudentIds: [],
        assignedStudentNames: [],
        kkmScore: 75,
        activeLevels: [1, 2, 3, 4, 5],
        instructions:
          'Taklukkan 50 tantangan Excel dalam 5 misi bertahap untuk meraih gelar Excel Grand Master!',
        allowReplay: true,
        updatedBy: 'Sistem'
      });
    }

    const session = await getAuthSession();
    const role = session?.user?.role || 'GUEST';
    const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL';

    // If teacher/admin, always permitted to play and configure
    if (isTeacherOrAdmin) {
      return NextResponse.json({
        success: true,
        config,
        isTeacher: true,
        hasAccess: true,
        userRole: role,
        userName: session?.user?.name || 'Bapak/Ibu Guru'
      });
    }

    // Check lock status for students / guests
    if (config.isLocked) {
      return NextResponse.json({
        success: true,
        config: {
          isLocked: true,
          lockMessage: config.lockMessage,
          assignmentMode: config.assignmentMode
        },
        isTeacher: false,
        hasAccess: false,
        accessReason: config.lockMessage || 'Game sedang dikunci oleh guru.',
        userRole: role,
        userName: session?.user?.name || 'Tamu'
      });
    }

    // Check Assignment Mode
    if (config.assignmentMode === 'ALL') {
      return NextResponse.json({
        success: true,
        config,
        isTeacher: false,
        hasAccess: true,
        userRole: role,
        userName: session?.user?.name || 'Siswa'
      });
    }

    // If user is not logged in but assignment is restricted
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: true,
        config: {
          isLocked: true,
          lockMessage: 'Game ini hanya dibuka untuk siswa dan kelas tertentu. Silakan login terlebih dahulu.',
          assignmentMode: config.assignmentMode
        },
        isTeacher: false,
        hasAccess: false,
        accessReason: 'Game ini memerlukan login akun siswa yang terdaftar.',
        userRole: 'GUEST'
      });
    }

    // Find student profile and their enrolled classes
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({
        success: true,
        config,
        isTeacher: false,
        hasAccess: false,
        accessReason: 'Akun pengguna tidak ditemukan.',
        userRole: role
      });
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    const studentProfileId = studentProfile?._id?.toString() || '';

    // Check specific students
    if (config.assignmentMode === 'SPECIFIC_STUDENTS') {
      const allowedStudentIds = (config.assignedStudentIds || []).map((id: any) => id.toString());
      const hasSpecificAccess = allowedStudentIds.includes(studentProfileId);

      return NextResponse.json({
        success: true,
        config,
        isTeacher: false,
        hasAccess: hasSpecificAccess,
        accessReason: hasSpecificAccess
          ? 'Akses diberikan'
          : 'Maaf, akun Anda belum terdaftar dalam penugasan Excel Master Challenge saat ini. Hubungi guru Anda.',
        userRole: role,
        userName: studentProfile?.fullName || session.user.name
      });
    }

    // Check class assignment
    if (config.assignmentMode === 'CLASS_ONLY') {
      if (!studentProfile) {
        return NextResponse.json({
          success: true,
          config,
          isTeacher: false,
          hasAccess: false,
          accessReason: 'Profil siswa tidak ditemukan untuk verifikasi kelas.',
          userRole: role
        });
      }

      const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
      const studentClassIds = enrollments.map((e: any) => e.classId?.toString());
      const allowedClassIds = (config.assignedClassIds || []).map((id: any) => id.toString());

      const isEnrolledInAssignedClass = studentClassIds.some((cId: string) =>
        allowedClassIds.includes(cId)
      );

      return NextResponse.json({
        success: true,
        config,
        isTeacher: false,
        hasAccess: isEnrolledInAssignedClass,
        accessReason: isEnrolledInAssignedClass
          ? 'Akses diberikan'
          : 'Maaf, kelas Anda saat ini belum ditugaskan untuk game Excel Master Challenge. Hubungi guru Anda.',
        userRole: role,
        userName: studentProfile?.fullName || session.user.name
      });
    }

    return NextResponse.json({
      success: true,
      config,
      isTeacher: false,
      hasAccess: true,
      userRole: role
    });
  } catch (error: any) {
    console.error('Error fetching Excel Master settings:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan Excel Master Challenge', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getAuthSession();
    const role = session?.user?.role;

    if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
      return NextResponse.json(
        { error: 'Hanya guru atau admin yang memiliki hak mengubah pengaturan game.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      isLocked,
      lockMessage,
      assignmentMode,
      assignedClassIds,
      assignedClassNames,
      assignedStudentIds,
      assignedStudentNames,
      kkmScore,
      activeLevels,
      instructions,
      allowReplay
    } = body;

    let config = await ExcelMasterConfig.findOne();
    if (!config) {
      config = new ExcelMasterConfig();
    }

    if (typeof isLocked === 'boolean') config.isLocked = isLocked;
    if (typeof lockMessage === 'string') config.lockMessage = lockMessage;
    if (assignmentMode && ['ALL', 'CLASS_ONLY', 'SPECIFIC_STUDENTS'].includes(assignmentMode)) {
      config.assignmentMode = assignmentMode;
    }
    if (Array.isArray(assignedClassIds)) config.assignedClassIds = assignedClassIds;
    if (Array.isArray(assignedClassNames)) config.assignedClassNames = assignedClassNames;
    if (Array.isArray(assignedStudentIds)) config.assignedStudentIds = assignedStudentIds;
    if (Array.isArray(assignedStudentNames)) config.assignedStudentNames = assignedStudentNames;
    if (typeof kkmScore === 'number') config.kkmScore = kkmScore;
    if (Array.isArray(activeLevels)) config.activeLevels = activeLevels;
    if (typeof instructions === 'string') config.instructions = instructions;
    if (typeof allowReplay === 'boolean') config.allowReplay = allowReplay;

    config.updatedBy = session?.user?.name || 'Guru';
    config.updatedAt = new Date();

    await config.save();

    return NextResponse.json({
      success: true,
      message: 'Pengaturan Excel Master Challenge berhasil diperbarui.',
      config
    });
  } catch (error: any) {
    console.error('Error updating Excel Master settings:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui pengaturan Excel Master Challenge', details: error.message },
      { status: 500 }
    );
  }
}
