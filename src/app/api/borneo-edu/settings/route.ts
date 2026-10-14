import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { BorneoEduConfig } from '@/models/BorneoEdu';
import { DEFAULT_TEACHER_CONFIG } from '@/modules/borneo-edu/storage';

export async function GET() {
  try {
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'default',
        data: DEFAULT_TEACHER_CONFIG
      });
    }

    await dbConnect();
    const config = await BorneoEduConfig.findOne().lean();

    return NextResponse.json({
      success: true,
      data: config || DEFAULT_TEACHER_CONFIG
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      mode: 'fallback',
      data: DEFAULT_TEACHER_CONFIG
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hasDb = process.env.DATABASE_URL || process.env.MONGODB_URI;

    if (!hasDb) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        data: body
      });
    }

    await dbConnect();
    const updated = await BorneoEduConfig.findOneAndUpdate(
      {},
      { $set: body },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
