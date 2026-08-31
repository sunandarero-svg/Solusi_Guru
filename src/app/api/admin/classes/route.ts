import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Class } from "@/models/Class";
import { getAllClasses } from "@/modules/auth/classService";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const classes = await getAllClasses();
    return NextResponse.json(classes);
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
    
    const existing = await Class.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Kelas dengan nama ini sudah ada." }, { status: 400 });
    }

    const newClass = await Class.create({
      name,
      description
    });

    return NextResponse.json({ id: newClass._id.toString(), ...newClass.toObject() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
