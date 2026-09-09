import { NextResponse } from "next/server";
import { getAuthSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    await User.updateOne(
      { email: session.user.email },
      { $set: { lastActiveAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
