import { NextResponse } from "next/server";
import { requireAdminSession } from "@/modules/auth/session";
import { getAdminStats } from "@/modules/admin/adminService";

// GET: Admin dashboard stats
export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
