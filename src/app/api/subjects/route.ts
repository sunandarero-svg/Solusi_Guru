import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { Subject } from "@/models/Subject";
import { getAuthSession } from "@/modules/auth/session";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    
    const mapped = subjects.map(s => ({ ...s, id: s._id.toString() }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
