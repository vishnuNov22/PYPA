import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/session";
import { uploadsDir } from "@/lib/db";

export const dynamic = "force-dynamic";
const TYPES: Record<string, string> = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_req: Request, { params }: { params: { kind: string; name: string } }) {
  const { kind, name } = params;
  if (!["letter", "public"].includes(kind) || !/^[A-Za-z0-9_.-]+$/.test(name)) return new NextResponse("Not found", { status: 404 });
  if (kind === "letter" && !getSession()) return new NextResponse("Sign in to view this file", { status: 401 });
  const file = path.join(uploadsDir(), kind, name);
  if (!fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
  const ext = path.extname(name).toLowerCase();
  return new NextResponse(fs.readFileSync(file), { headers: { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": kind === "public" ? "public, max-age=3600" : "private, max-age=0", "Content-Disposition": "inline" } });
}
