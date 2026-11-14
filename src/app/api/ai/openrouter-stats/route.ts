import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { openRouterQueue } from "@/modules/ai/openRouterQueue";

/**
 * GET /api/ai/openrouter-stats
 * Mengambil informasi kuota saat ini: RPM, RPD, TPD, panjang antrian.
 */
export async function GET(req: NextRequest) {
  try {
    const stats = openRouterQueue.getStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to get OpenRouter stats" }, { status: 500 });
  }
}

/**
 * POST /api/ai/openrouter-stats
 * Reset manual counter TPD & RPD ke 0.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action === "reset" || req.nextUrl.searchParams.get("action") === "reset") {
      const updatedStats = openRouterQueue.resetDailyStats();
      return NextResponse.json({
        success: true,
        message: "TPD dan RPD OpenRouter berhasil direset ke 0.",
        data: updatedStats,
      });
    }

    return NextResponse.json({
      success: true,
      data: openRouterQueue.getStats(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to reset OpenRouter stats" }, { status: 500 });
  }
}
