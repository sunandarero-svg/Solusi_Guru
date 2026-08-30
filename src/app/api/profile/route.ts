import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.id);
    const profile = await TeacherProfile.findOne({ userId: session.id });

    if (!user || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      fullName: profile.fullName,
      email: user.email,
      avatarUrl: profile.avatarUrl || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fullName, password, avatarUrl } = body;

    await dbConnect();

    // Update Profile
    if (fullName !== undefined || avatarUrl !== undefined) {
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      
      await TeacherProfile.findOneAndUpdate({ userId: session.id }, updateData);
    }

    // Update Password
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.findByIdAndUpdate(session.id, { password: hashedPassword });
    }

    return NextResponse.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
