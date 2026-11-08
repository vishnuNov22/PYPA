import { cookies } from "next/headers";
import { db } from "./db";
import { sign, verify } from "./crypto";
import type { SessionUser, User } from "./types";

export const COOKIE = "pypa_session";
const toSession = (u: User): SessionUser => ({ id: u.id, email: u.email, role: u.role, unitId: u.unitId, name: u.name });

export function getSession(): SessionUser | null {
  const t = cookies().get(COOKIE)?.value;
  const p = verify<{ uid: string }>(t);
  if (!p) return null;
  const u = db().users.find((x) => x.id === p.uid);
  return u ? toSession(u) : null;
}
export function setSession(u: User) {
  cookies().set(COOKIE, sign({ uid: u.id }, 7 * 86400), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1", path: "/", maxAge: 7 * 86400,
  });
}
export function clearSession() { cookies().delete(COOKIE); }
