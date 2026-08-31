import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;
    if (user.role === 'TEACHER') {
      profile = await TeacherProfile.findOne({ userId: user._id });
    } else if (user.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: user._id });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      fullName: profile.fullName,
      email: user.email,
      avatarUrl: (profile as any).avatarUrl || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fullName, password, avatarUrl } = body;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Profile
    if (fullName !== undefined || avatarUrl !== undefined) {
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      
      if (user.role === 'TEACHER') {
        await TeacherProfile.findOneAndUpdate({ userId: user._id }, updateData);
      } else if (user.role === 'STUDENT') {
        // Students might not have avatarUrl in their schema, but let's pass it anyway or omit it
        const studentUpdateData: any = {};
        if (fullName !== undefined) studentUpdateData.fullName = fullName;
        await StudentProfile.findOneAndUpdate({ userId: user._id }, studentUpdateData);
      }
    }

    // Update Password
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.findByIdAndUpdate(user._id, { passwordHash: hashedPassword });
    }

    return NextResponse.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
