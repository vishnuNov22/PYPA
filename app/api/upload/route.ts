import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/session";
import { uploadsDir } from "@/lib/db";
import { uid } from "@/lib/util";

export const dynamic = "force-dynamic";
/**
 * kind=letter  : PDF or JPG, State only, size limited by MAX_ATTACH_MB (default 2). Served only to signed-in users.
 * kind=public  : admin-only uploads for the public site (images, Kahalam PDFs). Served publicly.
 */
const RULES = {
  letter: { roles: ["state"], exts: [".pdf", ".jpg", ".jpeg"], mb: () => +(process.env.MAX_ATTACH_MB || 2) },
  public: { roles: ["admin"], exts: [".pdf", ".jpg", ".jpeg", ".png", ".webp"], mb: () => 25 },
} as const;

export async function POST(req: Request) {
  const user = getSession();
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const form = await req.formData();
  const kind = String(form.get("kind")) as keyof typeof RULES;
  const file = form.get("file");
  const rule = RULES[kind];
  if (!rule || !(file instanceof File)) return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  if (!(rule.roles as readonly string[]).includes(user.role)) return NextResponse.json({ ok: false, error: "You cannot upload this kind of file." }, { status: 403 });
  const ext = path.extname(file.name).toLowerCase();
  if (!(rule.exts as readonly string[]).includes(ext)) return NextResponse.json({ ok: false, error: `Allowed file types: ${rule.exts.join(", ")}` }, { status: 400 });
  if (file.size > rule.mb() * 1048576) return NextResponse.json({ ok: false, error: `The file is larger than ${rule.mb()} MB.` }, { status: 400 });
  const dir = path.join(uploadsDir(), kind);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${uid("f")}${ext}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, data: { name: file.name, size: file.size, date: new Date().toISOString(), url: `/api/files/${kind}/${name}` } });
}
