import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { StudentProfile } from "@/models/Profile";
import { Material } from "@/models/Material";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      return NextResponse.json({ error: "Hanya siswa yang dapat menandai materi sebagai telah dibaca" }, { status: 403 });
    }

    const material = await Material.findById(resolvedParams.id);
    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
    }

    // Tambahkan studentProfile._id jika belum ada
    const alreadyRead = material.readByStudents.some(
      (sId: any) => sId.toString() === studentProfile._id.toString()
    );

    if (!alreadyRead) {
      material.readByStudents.push(studentProfile._id);
      await material.save();
    }

    return NextResponse.json({
      success: true,
      message: "Materi berhasil ditandai telah dibaca",
      isReadByMe: true,
    });
  } catch (error: any) {
    console.error("[Material Read POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
