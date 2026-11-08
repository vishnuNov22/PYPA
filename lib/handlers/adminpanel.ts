import { db } from "../db";
import { ageOn, uid } from "../util";
import { bad, findDupes, logAct, notify, requireRole, runAgeOver, runDuplicateCheck, ukey, unitBy, ROLE_NAME, activeFreeze } from "../domain";
import { hashPassword, tempPassword } from "../crypto";
import { sendMail, smtpConfigured } from "../mail";
import type { SessionUser } from "../types";

function userRow(x: ReturnType<typeof db>["users"][number]) {
  let zone = "";
  if (x.role === "zone") zone = unitBy("zone", x.unitId)?.name || "";
  else if (x.role === "centre" || x.role === "local") zone = unitBy("zone", unitBy(x.role, x.unitId)?.zoneId)?.name || "";
  return { id: x.id, name: x.name, email: x.email, role: x.role, roleName: ROLE_NAME[x.role], zone, mustChange: x.mustChange };
}
const base = () => process.env.APP_URL || "http://localhost:3000";

export const adminPanelHandlers = {
  /* ---- edit freeze ---- */
  "freeze.list": (u: SessionUser) => {
    requireRole(u, "state");
    const now = Date.now();
    return { active: activeFreeze() || null, rows: db().freezes.map((f) => ({ ...f, status: f.ended ? "Ended" : new Date(f.start).getTime() <= now && new Date(f.end).getTime() >= now ? "Active" : new Date(f.start).getTime() > now ? "Scheduled" : "Ended" })) };
  },
  "freeze.add": (u: SessionUser, i: { start: string; end: string; remarks: string }) => {
    requireRole(u, "state");
    if (!i.start || !i.end) throw bad("Enter the start and end date and time.");
    if (isNaN(new Date(i.start).getTime()) || isNaN(new Date(i.end).getTime())) throw bad("Enter valid dates.");
    if (new Date(i.end).getTime() <= new Date(i.start).getTime()) throw bad("The end must be after the start.");
    db().freezes.unshift({ id: uid("f"), start: i.start, end: i.end, remarks: (i.remarks || "").trim(), ended: false });
    logAct(u, "Add", `Added edit freeze: ${i.remarks || "no remarks"}.`);
    const d = db();
    notify(u, [...d.zones.map((z) => ukey("zone", z.id)), ...d.centres.map((c) => ukey("centre", c.id)), ...d.locals.map((l) => ukey("local", l.id))], "Editing will be frozen", `State has scheduled an edit freeze${i.remarks ? ` (${i.remarks})` : ""}.`);
    return { ok: true };
  },
  "freeze.end": (u: SessionUser, i: { id: string }) => {
    requireRole(u, "state");
    const f = db().freezes.find((x) => x.id === i.id);
    if (!f) throw bad("Not found");
    f.ended = true;
    if (new Date(f.end).getTime() > Date.now()) f.end = new Date().toISOString();
    logAct(u, "Edit", "Ended an edit freeze.");
    return { ok: true };
  },
  /* ---- age over ---- */
  "age.status": (u: SessionUser) => {
    requireRole(u, "state");
    const act = db().members.filter((m) => m.status === "Active");
    return { over: act.filter((m) => ageOn(m.dob) > 40).length, turning: act.filter((m) => ageOn(m.dob) === 40).length, last: db().runs.age };
  },
  "age.run": (u: SessionUser) => { requireRole(u, "state"); const n = runAgeOver(u); logAct(u, "Edit", `Age over process moved ${n} member(s) to inactive.`); return { n }; },
  /* ---- duplicates ---- */
  "dupes.run": (u: SessionUser) => { requireRole(u, "state"); const n = runDuplicateCheck(u); logAct(u, "Edit", `Duplicate member check found ${n} group(s).`); return { n }; },
  "dupes.notify": (u: SessionUser, i: { ids: string[] }) => {
    requireRole(u, "state");
    const ms = db().members.filter((m) => i.ids.includes(m.id));
    notify(u, [...new Set(ms.map((m) => `local:${m.local}`))], "Possible duplicate member", `${ms[0]?.name} appears more than once. Open Member Duplicate Page to review.`, "/portal/members/duplicates");
    logAct(u, "Edit", `Sent duplicate notice for ${ms[0]?.name}.`);
    return { ok: true };
  },
  "dupes.summary": (u: SessionUser) => { requireRole(u, "state"); return { groups: findDupes().length, last: db().runs.dup }; },
  /* ---- reset username / password ---- */
  "users.list": (u: SessionUser) => {
    requireRole(u, "state", "admin");
    return db().users.filter((x) => (u.role === "admin" ? x.role !== "admin" : ["zone", "centre", "local"].includes(x.role))).map(userRow);
  },
  "users.changeUsername": (u: SessionUser, i: { id: string; email: string }) => {
    requireRole(u, "state", "admin");
    const rec = db().users.find((x) => x.id === i.id);
    if (!rec || rec.role === "admin" || (u.role === "state" && rec.role === "state")) throw bad("You cannot change this account.");
    if (!/^\S+@\S+\.\S+$/.test(i.email || "")) throw bad("Enter a valid email address.");
    if (db().users.some((x) => x !== rec && x.email.toLowerCase() === i.email.toLowerCase())) throw bad("That username is already used.");
    const old = rec.email, un = unitBy(rec.role as never, rec.unitId);
    rec.email = i.email.trim();
    if (un && un.admin.email === old) un.admin.email = rec.email;
    const pw = tempPassword();
    rec.pw = hashPassword(pw); rec.mustChange = true;
    logAct(u, "Edit", `Changed username of ${rec.name}.`);
    const m = sendMail(rec.email, "Your PYPA portal username changed", `Hello,\n\nThe username for ${rec.name} is now ${rec.email}.\nSign in at ${base()}/login with this temporary password: ${pw}\nYou will be asked to choose a new password.`);
    return { devMail: smtpConfigured() ? undefined : m };
  },
  "users.resetPassword": (u: SessionUser, i: { id: string }) => {
    requireRole(u, "state", "admin");
    const rec = db().users.find((x) => x.id === i.id);
    if (!rec || rec.role === "admin" || (u.role === "state" && rec.role === "state")) throw bad("You cannot reset this account.");
    const pw = tempPassword();
    rec.pw = hashPassword(pw); rec.mustChange = true;
    logAct(u, "Edit", `Triggered password reset for ${rec.name}.`);
    const m = sendMail(rec.email, "Reset your PYPA portal password", `Hello,\n\nA password reset was started for ${rec.name}.\nTemporary password: ${pw}\nSign in at ${base()}/login. You will be asked to choose a new password.`);
    return { devMail: smtpConfigured() ? undefined : m };
  },
};
