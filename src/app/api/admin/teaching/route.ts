import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { TeacherClass, Class } from "@/models/Class";
import { TeacherProfile } from "@/models/Profile";
import { Subject } from "@/models/Subject";
import { mapId } from "@/lib/mapId";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    
    // Get all teachings, populate teacher, class, subject
    const mappings = await TeacherClass.find()
      .populate('teacherId', 'fullName')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .lean();

    const formattedMappings = mappings.map((m: any) => ({
      id: m._id.toString(),
      teacherId: m.teacherId?._id?.toString(),
      teacherName: m.teacherId?.fullName || 'Unknown',
      classId: m.classId?._id?.toString(),
      className: m.classId?.name || 'Unknown',
      subjectId: m.subjectId?._id?.toString(),
      subjectName: m.subjectId?.name || 'Unknown',
    }));

    return NextResponse.json(formattedMappings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { teacherId, classId, subjectId, force } = body;

    if (!teacherId || !classId || !subjectId) {
      return NextResponse.json({ error: "Semua bidang (Guru, Kelas, Mata Pelajaran) harus diisi." }, { status: 400 });
    }

    await dbConnect();
    
    // Check if this EXACT mapping exists
    const exactMatch = await TeacherClass.findOne({ teacherId, classId, subjectId });
    if (exactMatch) {
      return NextResponse.json({ error: "Guru ini sudah ditugaskan untuk mata pelajaran dan kelas yang sama." }, { status: 400 });
    }

    // Check if another teacher is already teaching this subject in this class
    if (!force) {
      const conflict = await TeacherClass.findOne({ classId, subjectId })
        .populate('teacherId', 'fullName');
      if (conflict) {
        return NextResponse.json({
          warning: true,
          message: `Perhatian: Kelas ini sudah diajar mata pelajaran ini oleh guru ${(conflict as any).teacherId?.fullName}. Apakah Anda yakin ingin menambahkan guru lain untuk mata pelajaran yang sama di kelas ini?`
        }, { status: 409 });
      }
    }

    const newMapping = await TeacherClass.create({
      teacherId,
      classId,
      subjectId
    });

    return NextResponse.json({ success: true, id: newMapping._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
