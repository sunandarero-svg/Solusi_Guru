import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Enrollment } from "@/models/Class";
import { Material } from "@/models/Material";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "STUDENT") {
      return NextResponse.json({
        isAllowed: true,
        hasUnreadMaterials: false,
        unreadMaterials: [],
        totalMaterials: 0,
      });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({
        isAllowed: true,
        hasUnreadMaterials: false,
        unreadMaterials: [],
      });
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      return NextResponse.json({
        isAllowed: true,
        hasUnreadMaterials: false,
        unreadMaterials: [],
      });
    }

    const enrollments = await Enrollment.find({ studentId: studentProfile._id }).lean();
    const classIds = enrollments.map((e) => e.classId);

    const materials = await Material.find({
      classId: { $in: classIds },
      isPublished: true,
    })
      .populate("classId", "name")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const unreadMaterials = materials.filter(
      (m: any) =>
        !m.readByStudents ||
        !m.readByStudents.some(
          (sId: any) => sId.toString() === studentProfile._id.toString()
        )
    );

    const hasUnread = unreadMaterials.length > 0;

    return NextResponse.json({
      isAllowed: !hasUnread,
      hasUnreadMaterials: hasUnread,
      unreadMaterials: unreadMaterials.map((m: any) => ({
        id: m._id.toString(),
        title: m.title,
        description: m.description,
        className: m.className || m.classId?.name || "Kelas",
        subjectName: m.subjectId?.name || "Umum",
        fileType: m.fileType,
        sourceType: m.sourceType,
        fileUrl: m.fileUrl,
        content: m.content,
      })),
      totalMaterials: materials.length,
    });
  } catch (error: any) {
    console.error("[Student Material Status Error]", error);
    return NextResponse.json({
      isAllowed: true,
      hasUnreadMaterials: false,
      unreadMaterials: [],
    });
  }
}
