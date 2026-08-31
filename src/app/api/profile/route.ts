import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { TeacherProfile, StudentProfile } from "@/models/Profile";
import bcrypt from "bcryptjs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

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

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let fullName, password, avatarUrl;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      fullName = formData.get("fullName") as string;
      password = formData.get("password") as string;
      
      const file = formData.get("avatar") as File;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(uploadDir, { recursive: true });
        
        const ext = path.extname(file.name) || ".jpg";
        const filename = `${user._id}${ext}`;
        const filePath = path.join(uploadDir, filename);
        
        await writeFile(filePath, buffer);
        avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;
      }
    } else {
      const body = await req.json();
      fullName = body.fullName;
      password = body.password;
      avatarUrl = body.avatarUrl;
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
