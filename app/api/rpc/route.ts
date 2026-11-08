import { NextResponse } from "next/server";
import { HANDLERS, PUBLIC_ACTIONS } from "@/lib/rpc";
import { HttpError, runScheduled } from "@/lib/domain";
import { getSession } from "@/lib/session";
import { save } from "@/lib/db";

export const dynamic = "force-dynamic";
const READ = /(\.list|\.get|\.overview|\.eligible|\.tree|\.allLocals|\.info|\.audience|\.calc|\.status|\.summary|\.candidates|\.lists|\.dupes)$/;

export async function POST(req: Request) {
  let body: { action?: string; input?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const action = String(body.action || "");
  const h = HANDLERS[action];
  if (!h) return NextResponse.json({ ok: false, error: `Unknown action ${action}` }, { status: 404 });
  const user = getSession();
  if (!PUBLIC_ACTIONS.has(action) && !user) return NextResponse.json({ ok: false, error: "Please sign in again.", code: "AUTH" }, { status: 401 });
  try {
    runScheduled();
    const data = await h(user, body.input ?? {});
    if (!READ.test(action)) save();
    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
    console.error(action, e);
    return NextResponse.json({ ok: false, error: "Something went wrong on the server." }, { status: 500 });
  }
}
