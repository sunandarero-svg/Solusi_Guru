import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { TeacherClass } from "@/models/Class";
import "@/models/Class";
import "@/models/Profile";
import "@/models/Subject";
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
    const { teacherId, classIds, subjectIds, force } = body;

    if (!teacherId || !classIds || !subjectIds || classIds.length === 0 || subjectIds.length === 0) {
      return NextResponse.json({ error: "Semua bidang (Guru, Kelas, Mata Pelajaran) harus diisi minimal satu." }, { status: 400 });
    }

    await dbConnect();
    
    // Create cartesian product
    const newMappings = [];
    for (const cId of classIds) {
      for (const sId of subjectIds) {
        newMappings.push({ teacherId, classId: cId, subjectId: sId });
      }
    }

    // Check exact matches
    for (const m of newMappings) {
      const exactMatch = await TeacherClass.findOne(m);
      if (exactMatch) {
        return NextResponse.json({ error: "Beberapa penugasan sudah ada sebelumnya dan tidak dapat ditambahkan lagi." }, { status: 400 });
      }
    }

    // Check if another teacher is already teaching this subject in this class
    if (!force) {
      const conflicts = [];
      for (const m of newMappings) {
        const conflict = await TeacherClass.findOne({ classId: m.classId, subjectId: m.subjectId })
          .populate('teacherId', 'fullName')
          .populate('classId', 'name')
          .populate('subjectId', 'name');
        
        if (conflict) {
          conflicts.push(`Kelas ${(conflict as any).classId?.name} (Mapel: ${(conflict as any).subjectId?.name}) oleh ${(conflict as any).teacherId?.fullName}`);
        }
      }

      if (conflicts.length > 0) {
        return NextResponse.json({
          warning: true,
          message: `Perhatian: Ada bentrok pengajar.\n${conflicts.join('\n')}\nApakah Anda yakin ingin menambahkan guru lain untuk mapel yang sama?`
        }, { status: 409 });
      }
    }

    const created = await TeacherClass.insertMany(newMappings);

    return NextResponse.json({ success: true, count: created.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

