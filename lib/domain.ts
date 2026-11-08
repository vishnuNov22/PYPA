import { db, save } from "./db";
import { ageOn, pad, uid } from "./util";
import { hashPassword, tempPassword } from "./crypto";
import { sendMail } from "./mail";
import type { Kind, Member, SessionUser, Unit, UnitKind, DB, Role } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const bad = (m: string) => new HttpError(400, m);
export const forbidden = (m = "You do not have permission to do that.") => new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);

export const COLL: Record<Kind, "zones" | "centres" | "locals"> = { zone: "zones", centre: "centres", local: "locals" };
export const ROLE_NAME: Record<Role, string> = { admin: "Admin", state: "State", zone: "Zone", centre: "Centre", local: "Local PYPA" };

export const ukey = (k: UnitKind, id: string | null) => (k === "state" ? "state" : `${k}:${id}`);
export const myKey = (u: SessionUser) => ukey(u.role as UnitKind, u.unitId);

export function unitBy(kind: UnitKind, id: string | null | undefined): Unit | undefined {
  const d = db();
  if (kind === "state") return d.state;
  return d[COLL[kind]].find((x) => x.id === id);
}
export function unitLabel(kind: UnitKind, id: string | null | undefined) {
  const u = unitBy(kind, id);
  if (!u) return "—";
  return kind === "state" ? "PYPA Kerala State" : kind === "zone" ? `${u.name} Zone` : kind === "centre" ? `${u.name} Centre` : u.name;
}
export function keyLabel(k: string) {
  const [a, b] = k.split(":");
  return unitLabel(a as UnitKind, b);
}
export const memberBy = (id: string) => db().members.find((m) => m.id === id);
export function chainOf(kind: UnitKind, u: Unit): string[] {
  return kind === "local" ? [`centre:${u.centreId}`, `zone:${u.zoneId}`, "state"] : kind === "centre" ? [`zone:${u.zoneId}`, "state"] : kind === "zone" ? ["state"] : [];
}
export const isCurrent = (termEnds: string) => termEnds >= new Date().toISOString().slice(0, 10);

/* ---------- scope & permissions ---------- */
export function scopeMembers(u: SessionUser): Member[] {
  const m = db().members;
  if (u.role === "state" || u.role === "admin") return m;
  return m.filter((x) => x[u.role as Kind] === u.unitId);
}
export function scopeUnits(u: SessionUser, kind: Kind): Unit[] {
  const L = db()[COLL[kind]];
  if (u.role === "state" || u.role === "admin") return L;
  if (u.role === "zone") return kind === "zone" ? L.filter((x) => x.id === u.unitId) : L.filter((x) => x.zoneId === u.unitId);
  if (u.role === "centre") return kind === "local" ? L.filter((x) => x.centreId === u.unitId) : kind === "centre" ? L.filter((x) => x.id === u.unitId) : [];
  return kind === "local" ? L.filter((x) => x.id === u.unitId) : [];
}
export function inScopeUnit(u: SessionUser, kind: Kind, id: string) {
  return scopeUnits(u, kind).some((x) => x.id === id);
}
export function canEditUnit(u: SessionUser, kind: Kind, unit: Unit) {
  if (u.role === "state") return true;
  if (u.role === kind && u.unitId === unit.id) return true;
  return u.role === "centre" && kind === "local" && unit.centreId === u.unitId && !unit.registered;
}
export function canEditMember(u: SessionUser, m: Member) {
  if (u.role === "state") return true;
  if (u.role === "zone" || u.role === "admin") return false;
  if (u.role === "centre") return m.centre === u.unitId && !unitBy("local", m.local)?.registered;
  return m.local === u.unitId;
}
export const canAddMember = (u: SessionUser) => u.role === "state" || u.role === "centre" || u.role === "local";
export const canAddUnit = (u: SessionUser, kind: Kind) => u.role === "state" || (u.role === "centre" && kind === "local");
export function requireRole(u: SessionUser, ...roles: Role[]) {
  if (!roles.includes(u.role)) throw forbidden();
}

/* ---------- freeze ---------- */
export function activeFreeze() {
  const n = Date.now();
  return db().freezes.find((f) => !f.ended && new Date(f.start).getTime() <= n && new Date(f.end).getTime() >= n);
}
export function assertEditable(u: SessionUser) {
  if (u.role === "state" || u.role === "admin") return;
  const f = activeFreeze();
  if (f) throw new HttpError(423, `Edits are frozen${f.remarks ? ` (${f.remarks})` : ""} until ${new Date(f.end).toLocaleString("en-IN")}.`);
}

/* ---------- activity & notifications ---------- */
export function logAct(u: SessionUser, type: "Add" | "Edit", desc: string) {
  let z: string | null = null;
  if (u.role === "zone") z = u.unitId;
  else if (u.role === "centre") z = unitBy("centre", u.unitId)?.zoneId ?? null;
  else if (u.role === "local") z = unitBy("local", u.unitId)?.zoneId ?? null;
  db().activity.unshift({
    id: uid("a"), date: new Date().toISOString(), role: u.role, unitId: u.unitId, zoneId: z,
    user: u.role === "admin" ? "Portal Administrator" : unitLabel(u.role as UnitKind, u.unitId), type, desc,
  });
  if (db().activity.length > 2000) db().activity.length = 2000;
}
export function notify(from: SessionUser | null, to: string[], title: string, body: string, go?: string) {
  const self = from ? myKey(from) : null;
  const set = [...new Set(to)].filter((k) => k !== self);
  if (!set.length) return;
  db().notifs.unshift({ id: uid("n"), to: set, title, body, date: new Date().toISOString(), readBy: [], ...(go ? { go } : {}) });
  if (db().notifs.length > 3000) db().notifs.length = 3000;
}
export const myNotifs = (u: SessionUser) => db().notifs.filter((n) => n.to.includes(myKey(u))).sort((a, b) => b.date.localeCompare(a.date));
export const unreadCount = (u: SessionUser) => (u.role === "admin" ? 0 : myNotifs(u).filter((n) => !n.readBy.includes(myKey(u))).length);

/* ---------- accounts ---------- */
export function createAccount(role: Kind, unit: Unit) {
  const d = db();
  const pw = tempPassword();
  let user = d.users.find((x) => x.email.toLowerCase() === unit.admin.email.toLowerCase());
  if (user) { user.pw = hashPassword(pw); user.mustChange = true; user.unitId = unit.id; user.role = role; }
  else d.users.push({ id: uid("u"), email: unit.admin.email, role, unitId: unit.id, name: unitLabel(role, unit.id), pw: hashPassword(pw), mustChange: true });
  const base = process.env.APP_URL || "http://localhost:3000";
  return sendMail(unit.admin.email, "Welcome to the PYPA Kerala portal",
    `Hello ${unit.admin.name},\n\nYour login for ${unitLabel(role, unit.id)} is ready.\n\nUsername: ${unit.admin.email}\nTemporary password: ${pw}\nPortal: ${base}/login\n\nYou will be asked to change the password when you sign in for the first time.\n\nSaved to Serve,\nPYPA Kerala State`);
}

/* ---------- ids, dues, education ---------- */
export function nextMemberId(zoneCode: string) {
  const f = db().master.idFormat;
  const max = db().members.reduce((a, m) => Math.max(a, parseInt(m.id.split(f.sep).pop() || "0", 10) || 0), 0);
  return f.prefix + (f.useZone ? f.sep + zoneCode : "") + f.sep + pad(max + 1, f.digits);
}
export function dueInfo(ms: Member[]) {
  const YEAR = new Date().getFullYear();
  const act = ms.filter((m) => m.status === "Active");
  const by: Record<number, number> = {};
  let due = 0;
  act.forEach((m) => {
    let any = false;
    for (let y = +m.from; y <= YEAR; y++) if (!m.paid.includes(y)) { by[y] = (by[y] || 0) + 1; any = true; }
    if (any) due++;
  });
  const pending = Object.keys(by).map(Number).sort((a, b) => a - b);
  const min = Math.max(act.length ? Math.min(...act.map((m) => +m.from)) : YEAR, YEAR - 5);
  const paid: number[] = [];
  for (let y = min; y <= YEAR; y++) if (!by[y]) paid.push(y);
  return { total: act.length, due, by, pending, paid };
}
export const eduLevel = (m: Member) => (m.phd ? "PhD" : m.pg ? "PG" : m.pgd ? "PG Diploma" : m.ug ? "UG" : m.diploma ? "Diploma" : "Matriculation");

/* ---------- duplicates ---------- */
export function findDupes(): Member[][] {
  const act = db().members.filter((m) => m.status === "Active");
  const map: Record<string, Member[]> = {};
  act.forEach((m) => { const k = m.name.toLowerCase().trim(); (map[k] ||= []).push(m); });
  const groups: Member[][] = [];
  Object.values(map).forEach((g) => {
    if (g.length < 2) return;
    const used = new Set<Member>();
    g.forEach((a) => {
      if (used.has(a)) return;
      const cl = g.filter((b) => b === a || b.mobile === a.mobile || (b.email && b.email === a.email));
      if (cl.length > 1) { cl.forEach((x) => used.add(x)); groups.push(cl); }
    });
  });
  return groups;
}

/* ---------- scheduled jobs (also callable from /api/cron/*) ---------- */
export function runAgeOver(by: SessionUser | null = null) {
  const d = db();
  const due = d.members.filter((m) => m.status === "Active" && ageOn(m.dob) > 40);
  due.forEach((m) => { m.status = "Inactive"; m.reason = "Age Over"; });
  d.runs.age = { date: new Date().toISOString(), n: due.length };
  const keys = new Set<string>();
  due.forEach((m) => { keys.add(`zone:${m.zone}`); keys.add(`centre:${m.centre}`); keys.add(`local:${m.local}`); });
  if (due.length) notify(by, [...keys], "Members moved to inactive", `${due.length} member(s) crossed the age limit of 40 and are now inactive (Age Over).`);
  save();
  return due.length;
}
export function runDuplicateCheck(by: SessionUser | null = null) {
  const d = db();
  const g = findDupes();
  d.runs.dup = new Date().toISOString();
  notify(by, ["state"], "Duplicate members found", `The monthly check found ${g.length} possible duplicate group(s).`, "/portal/admin?tab=dupes");
  save();
  return g.length;
}
/** Lazy scheduler: runs due jobs at most once an hour when the server is hit. */
let lastSched = 0;
export function runScheduled() {
  if (Date.now() - lastSched < 3600e3) return;
  lastSched = Date.now();
  const d = db(), now = new Date();
  const dupDue = !d.runs.dup || Date.now() - new Date(d.runs.dup).getTime() > 30 * 864e5;
  if (dupDue && process.env.PYPA_AUTO_JOBS !== "off") runDuplicateCheck();
  const ageDue = now.getMonth() === 11 && now.getDate() === 31 && (!d.runs.age || new Date(d.runs.age.date).getFullYear() !== now.getFullYear());
  if (ageDue && process.env.PYPA_AUTO_JOBS !== "off") runAgeOver();
}
export type { DB };
