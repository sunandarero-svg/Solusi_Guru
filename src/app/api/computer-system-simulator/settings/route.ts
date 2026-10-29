import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { TeacherProfile, StudentProfile } from '@/models/Profile';
import { Class, TeacherClass, Enrollment } from '@/models/Class';
import { ComputerSystemSimulatorConfig } from '@/models/ComputerSystemSimulator';

async function resolveUserFromRequest(req: NextRequest, body?: any) {
  let userEmail: string | undefined;
  let role: string | undefined;
  let userName: string | undefined;

  // 1. Coba getServerSession
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      userEmail = session.user.email;
      role = session.user.role;
      userName = session.user.name || undefined;
    }
  } catch (err) {
    // Abaikan jika getServerSession terkendala
  }

  // 2. Coba getToken dari request cookies
  if (!userEmail) {
    try {
      const token = await getToken({
        req,
        secret: authOptions.secret || process.env.NEXTAUTH_SECRET || "fallback_secret_for_build_only_do_not_use_in_prod"
      });
      if (token) {
        userEmail = (token.email as string) || undefined;
        role = (token.role as string) || (token as any).userRole || undefined;
        userName = (token.name as string) || undefined;
      }
    } catch (err) {
      // Abaikan
    }
  }

  // 3. Fallback role jika dikirim dari komponen client guru
  if (!role && body?.userRole) {
    role = body.userRole;
  }
  if (!userName && body?.userName) {
    userName = body.userName;
  }

  return { userEmail, role, userName };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ambil konfigurasi Simulator Sistem Komputer dari database
    let config = await ComputerSystemSimulatorConfig.findOne().lean();
    if (!config) {
      config = {
        assignedClassIds: [],
        assignedClassNames: [],
        kkmScore: 75,
        activeLevels: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
        ],
        instructions:
          'Selesaikan tantangan arsitektur komputer, alur pemrosesan data, dan konversi heksadesimal, biner, serta oktal sesuai arahan guru.',
        allowReplay: true,
        isLocked: false,
        lockMessage: 'Simulator Sistem Komputer sedang dikunci oleh guru.'
      };
    }

    const { userEmail, role } = await resolveUserFromRequest(req);

    // Ambil seluruh kelas sekolah sebagai opsi kelas
    const allClasses = await Class.find().lean();
    const formattedAllClasses = allClasses.map((c: any) => ({
      id: c._id.toString(),
      name: c.name
    }));

    // 1. JIKA PENGGUNA ADALAH GURU ATAU ADMIN / PRINCIPAL
    if (role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL') {
      let teacherClasses: { id: string; name: string }[] = [];

      if (role === 'TEACHER' && userEmail) {
        const user = await User.findOne({ email: userEmail }).lean();
        if (user) {
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
        }
      }

      // Jika data relasi kelas guru kosong atau admin, sediakan seluruh kelas
      if (teacherClasses.length === 0) {
        teacherClasses = formattedAllClasses;
      }

      return NextResponse.json({
        success: true,
        isTeacher: true,
        role: role || 'TEACHER',
        teacherClasses,
        config
      });
    }

    // 2. JIKA PENGGUNA ADALAH SISWA
    if (role === 'STUDENT' && userEmail) {
      const user = await User.findOne({ email: userEmail }).lean();
      if (user) {
        const student = await StudentProfile.findOne({ userId: user._id }).lean();
        if (student) {
          const enrollments = await Enrollment.find({ studentId: student._id })
            .populate('classId')
            .lean();

          const studentClassIds = enrollments
            .map((e: any) => e.classId?._id?.toString())
            .filter(Boolean);
          const studentClassNames = enrollments
            .map((e: any) => e.classId?.name)
            .filter(Boolean);
          const primaryClassName = studentClassNames[0] || 'Kelas Siswa';

          const assignedIds: string[] = config.assignedClassIds || [];
          const assignedNames: string[] = (config.assignedClassNames || []).map(
            (n: string) => n.toLowerCase().trim()
          );

          // Jika guru belum menentukan kelas tertentu, simulator terbuka untuk semua kelas (atau jika kelas cocok)
          const isClassAssigned =
            assignedIds.length === 0 ||
            studentClassIds.some((id: string) => assignedIds.includes(id)) ||
            studentClassNames.some((name: string) =>
              assignedNames.includes(name.toLowerCase().trim())
            );

          const isLocked = Boolean(config.isLocked);
          const isAssigned = isClassAssigned && !isLocked;

          return NextResponse.json({
            success: true,
            isTeacher: false,
            role: 'STUDENT',
            studentClassName: primaryClassName,
            isAssigned,
            isLocked,
            lockReason:
              config.lockMessage ||
              'Simulator Sistem Komputer sedang dikunci oleh guru.',
            assignedClassNames: config.assignedClassNames || [],
            kkmScore: config.kkmScore || 75,
            activeLevels:
              config.activeLevels || [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
              ]
          });
        }
      }
    }

    // 3. FALLBACK GRACEFUL (Standalone / SmartBoard / Kiosk tanpa session cookie)
    return NextResponse.json({
      success: true,
      isTeacher: true,
      role: 'TEACHER',
      teacherClasses: formattedAllClasses,
      studentClassName: 'Kelas Siswa',
      isAssigned: (config.assignedClassIds || []).length > 0,
      config
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { userEmail, role, userName } = await resolveUserFromRequest(req, body);

    // Tolak jika akun terverifikasi adalah siswa
    if (role === 'STUDENT') {
      return NextResponse.json(
        {
          error:
            'Akses ditolak: Hanya guru yang dapat menugaskan Simulator Sistem Komputer ke kelas.'
        },
        { status: 403 }
      );
    }

    const existingConfig = await ComputerSystemSimulatorConfig.findOne().lean();
    const currentAssignedIds: string[] = existingConfig?.assignedClassIds || [];

    let updatedAssignedIds: string[] = [];

    if (role === 'TEACHER' && userEmail) {
      const user = await User.findOne({ email: userEmail }).lean();
      if (user) {
        const teacher = await TeacherProfile.findOne({ userId: user._id }).lean();
        if (teacher) {
          const teacherClasses = await TeacherClass.find({
            teacherId: teacher._id
          }).lean();
          if (teacherClasses.length > 0) {
            const myClassIdStrings = teacherClasses.map((tc: any) =>
              tc.classId.toString()
            );
            const otherTeachersClassIds = currentAssignedIds.filter(
              (id: string) => !myClassIdStrings.includes(id)
            );
            const mySelectedIds = (body.assignedClassIds || []).filter(
              (id: string) => myClassIdStrings.includes(id)
            );
            updatedAssignedIds = Array.from(
              new Set([...otherTeachersClassIds, ...mySelectedIds])
            );
          } else {
            updatedAssignedIds = body.assignedClassIds || [];
          }
        } else {
          updatedAssignedIds = body.assignedClassIds || [];
        }
      } else {
        updatedAssignedIds = body.assignedClassIds || [];
      }
    } else {
      updatedAssignedIds = body.assignedClassIds || [];
    }

    // Ambil nama kelas langsung dari database Class
    const assignedClasses = await Class.find({
      _id: { $in: updatedAssignedIds }
    }).lean();
    const assignedClassNames = assignedClasses.map((c: any) => c.name);

    const updatePayload = {
      isLocked:
        body.isLocked !== undefined
          ? Boolean(body.isLocked)
          : (existingConfig?.isLocked ?? false),
      lockMessage:
        body.lockMessage ||
        existingConfig?.lockMessage ||
        'Simulator Sistem Komputer sedang dikunci oleh guru.',
      assignedClassIds: updatedAssignedIds,
      assignedClassNames: assignedClassNames,
      kkmScore: Number(body.kkmScore) || existingConfig?.kkmScore || 75,
      activeLevels:
        body.activeLevels ||
        existingConfig?.activeLevels || [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
        ],
      instructions:
        body.instructions !== undefined
          ? body.instructions
          : (existingConfig?.instructions ||
            'Selesaikan tantangan arsitektur komputer, alur pemrosesan data, dan konversi heksadesimal, biner, serta oktal.'),
      allowReplay:
        body.allowReplay !== undefined ? Boolean(body.allowReplay) : true,
      updatedBy: userName || 'Guru'
    };

    const updated = await ComputerSystemSimulatorConfig.findOneAndUpdate(
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

