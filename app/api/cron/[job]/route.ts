import { NextResponse } from "next/server";
import { runAgeOver, runDuplicateCheck } from "@/lib/domain";

export const dynamic = "force-dynamic";
/**
 * Call from any scheduler (Vercel Cron, GitHub Actions, crontab):
 *   GET /api/cron/duplicates   monthly
 *   GET /api/cron/age-over     on 31 December
 * with header  Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request, { params }: { params: { job: string } }) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (params.job === "duplicates") return NextResponse.json({ ok: true, groups: runDuplicateCheck() });
  if (params.job === "age-over") return NextResponse.json({ ok: true, moved: runAgeOver() });
  return NextResponse.json({ ok: false }, { status: 404 });
}
