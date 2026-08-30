import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Subject } from "@/models/Subject";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    
    // Map _id to id
    const mapped = subjects.map(s => ({ ...s, id: s._id.toString() }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();
    
    // Check if exists
    const existing = await Subject.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Mata Pelajaran dengan nama ini sudah ada." }, { status: 400 });
    }

    const subject = await Subject.create({
      name,
      description
    });

    return NextResponse.json({ id: subject._id.toString(), ...subject.toObject() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
