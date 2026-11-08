import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32, { N: 16384 }).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 32, { N: 16384 });
  return a.length === b.length && timingSafeEqual(a, b);
}
const SECRET = () => process.env.SESSION_SECRET || "pypa-dev-secret-change-me";
export function sign(payload: Record<string, unknown>, ttlSec: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })).toString("base64url");
  const mac = createHmac("sha256", SECRET()).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function verify<T = Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const exp = createHmac("sha256", SECRET()).update(body).digest("base64url");
  if (mac.length !== exp.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(exp))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp < Date.now() / 1000) return null;
    return p as T;
  } catch { return null; }
}
export const tempPassword = () => "Pypa@" + (1000 + Math.floor(Math.random() * 9000));
