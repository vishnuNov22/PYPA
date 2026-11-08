import { db, save } from "../db";
import { hashPassword, sign, verify, verifyPassword } from "../crypto";
import { sendMail, smtpConfigured } from "../mail";
import { bad } from "../domain";
import { clearSession, setSession } from "../session";
import { logAct } from "../domain";
import type { SessionUser } from "../types";

const findByEmail = (e: string) => db().users.find((u) => u.email.toLowerCase() === String(e || "").trim().toLowerCase());
const checkPw = (p: string) => { if (!p || p.length < 8) throw bad("Use at least 8 characters."); if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) throw bad("Use letters and numbers in the password."); };

export const authHandlers = {
  "auth.login": (_u: SessionUser | null, i: { email: string; password: string }) => {
    const u = findByEmail(i.email);
    if (!u || !verifyPassword(i.password || "", u.pw)) throw bad("That username and password do not match. Check them or use Forgot password.");
    if (u.mustChange) return { mustChange: true, ticket: sign({ uid: u.id, p: "chg" }, 900), name: u.name };
    setSession(u);
    return { role: u.role };
  },
  "auth.firstPassword": (_u: SessionUser | null, i: { ticket: string; password: string }) => {
    const t = verify<{ uid: string; p: string }>(i.ticket);
    if (!t || t.p !== "chg") throw bad("This step expired. Sign in again.");
    checkPw(i.password);
    const u = db().users.find((x) => x.id === t.uid)!;
    u.pw = hashPassword(i.password); u.mustChange = false; save(); setSession(u);
    return { role: u.role };
  },
  "auth.forgotPassword": (_u: SessionUser | null, i: { email: string }) => {
    const u = findByEmail(i.email);
    let devMail;
    if (u) {
      const base = process.env.APP_URL || "http://localhost:3000";
      const link = `${base}/reset-password?token=${sign({ uid: u.id, p: "reset" }, 3600)}`;
      const m = sendMail(u.email, "Reset your PYPA portal password", `Hello,\n\nWe received a request to reset the password for ${u.email}.\nOpen this link within one hour to choose a new password:\n${link}\n\nIf you did not ask for this, tell the State office.`);
      if (!smtpConfigured()) devMail = m;
    }
    return { ok: true, devMail };
  },
  "auth.resetPassword": (_u: SessionUser | null, i: { token: string; password: string }) => {
    const t = verify<{ uid: string; p: string }>(i.token);
    if (!t || t.p !== "reset") throw bad("This reset link is invalid or has expired.");
    checkPw(i.password);
    const u = db().users.find((x) => x.id === t.uid);
    if (!u) throw bad("Account not found.");
    u.pw = hashPassword(i.password); u.mustChange = false; save();
    return { ok: true };
  },
  "auth.changePassword": (u: SessionUser | null, i: { current: string; password: string }) => {
    const rec = db().users.find((x) => x.id === u!.id)!;
    if (!verifyPassword(i.current || "", rec.pw)) throw bad("Your current password is not right.");
    checkPw(i.password);
    rec.pw = hashPassword(i.password); save();
    if (u!.role !== "admin") logAct(u!, "Edit", "Changed own password.");
    return { ok: true };
  },
  "auth.logout": () => { clearSession(); return { ok: true }; },
};
export const PUBLIC_ACTIONS = new Set(["auth.login", "auth.firstPassword", "auth.forgotPassword", "auth.resetPassword", "auth.logout", "jobs.post"]);
