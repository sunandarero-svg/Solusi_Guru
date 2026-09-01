import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { PrincipalProfile } from "@/models/Profile";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const principalProfile = await PrincipalProfile.findById(id);

    if (!principalProfile) {
      return NextResponse.json({ error: "Akun kepala sekolah tidak ditemukan" }, { status: 404 });
    }

    // Delete both the user and the profile
    await User.findByIdAndDelete(principalProfile.userId);
    await PrincipalProfile.findByIdAndDelete(id);

    return NextResponse.json({ message: "Akun kepala sekolah berhasil dihapus" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
