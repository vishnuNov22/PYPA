import { db } from "../db";
import { uid } from "../util";
import { assertEditable, bad, keyLabel, logAct, myKey, notify, unitBy, unitLabel, ROLE_NAME } from "../domain";
import { sendSms } from "../mail";
import type { Attachment, SessionUser } from "../types";

type Group = { id: string; label: string; options: { value: string; label: string }[] };
function audience(u: SessionUser): Group[] {
  const d = db();
  const o = (k: string, id: string, n: string) => ({ value: `${k}:${id}`, label: k === "zone" ? `${n} Zone` : k === "centre" ? `${n} Centre` : n });
  if (u.role === "state") return [
    { id: "zones", label: "Zones", options: d.zones.map((z) => o("zone", z.id, z.name)) },
    { id: "centres", label: "Centres", options: d.centres.map((c) => o("centre", c.id, c.name)) },
    { id: "locals", label: "Local PYPA", options: d.locals.map((l) => o("local", l.id, l.name)) },
  ];
  const un = unitBy(u.role as never, u.unitId)!;
  if (u.role === "zone") return [
    { id: "parents", label: "Parent body", options: [{ value: "state", label: "PYPA Kerala State" }] },
    { id: "centres", label: "Centres in this zone", options: d.centres.filter((c) => c.zoneId === un.id).map((c) => o("centre", c.id, c.name)) },
    { id: "locals", label: "Local PYPA in this zone", options: d.locals.filter((l) => l.zoneId === un.id).map((l) => o("local", l.id, l.name)) },
  ];
  if (u.role === "centre") return [
    { id: "parents", label: "Parent bodies", options: [{ value: `zone:${un.zoneId}`, label: unitLabel("zone", un.zoneId) }, { value: "state", label: "PYPA Kerala State" }] },
    { id: "locals", label: "Local PYPA in this centre", options: d.locals.filter((l) => l.centreId === un.id).map((l) => o("local", l.id, l.name)) },
  ];
  return [{ id: "parents", label: "Parent bodies", options: [{ value: `centre:${un.centreId}`, label: unitLabel("centre", un.centreId) }, { value: `zone:${un.zoneId}`, label: unitLabel("zone", un.zoneId) }, { value: "state", label: "PYPA Kerala State" }] }];
}
export const letterHandlers = {
  "letters.audience": (u: SessionUser) => ({ groups: audience(u), canAttach: u.role === "state", maxMb: +(process.env.MAX_ATTACH_MB || 2) }),
  "letters.list": (u: SessionUser) => {
    const k = myKey(u), L = db().letters;
    const map = (l: (typeof L)[number]) => ({ ...l, recipients: l.to.includes("all") ? "All units" : l.to.length > 3 ? `${l.to.slice(0, 3).map(keyLabel).join(", ")} +${l.to.length - 3}` : l.to.map(keyLabel).join(", ") });
    return {
      inbox: L.filter((l) => l.to.includes(k) || (l.to.includes("all") && l.from !== k)).sort((a, b) => b.date.localeCompare(a.date)).map(map),
      sent: L.filter((l) => l.from === k).sort((a, b) => b.date.localeCompare(a.date)).map(map),
    };
  },
  "letters.send": (u: SessionUser, i: { to: string[]; subject: string; body: string; attachment?: Attachment | null; sms?: boolean }) => {
    assertEditable(u);
    const allowed = new Set(audience(u).flatMap((g) => g.options.map((o) => o.value)));
    const to = [...new Set(i.to || [])].filter((k) => allowed.has(k) && k !== myKey(u));
    if (!to.length) throw bad("Choose at least one recipient.");
    if (!i.subject?.trim() || !i.body?.trim()) throw bad("Enter a subject and a message.");
    if (i.attachment && u.role !== "state") throw bad("Only State can attach files.");
    if (i.attachment && !/^\/api\/files\/letter\//.test(i.attachment.url || "")) throw bad("Attachment was not uploaded properly.");
    db().letters.unshift({ id: uid("l"), from: myKey(u), fromLabel: u.role === "admin" ? "Admin" : unitLabel(u.role as never, u.unitId), to, subject: i.subject.trim(), body: i.body.trim(), date: new Date().toISOString(), attachment: i.attachment || null, sms: !!i.sms });
    notify(u, to, "New letter", i.subject.trim(), "/portal/letters");
    if (i.sms) {
      const phones = to.map((k) => { const [a, b] = k.split(":"); return unitBy(a as never, b)?.admin.mobile; }).filter(Boolean) as string[];
      sendSms(phones, `PYPA Kerala: ${i.subject.trim()} — please check the portal.`);
    }
    logAct(u, "Add", `Sent letter “${i.subject.trim()}” to ${to.length} unit${to.length > 1 ? "s" : ""}.`);
    return { count: to.length };
  },
  "letters.clearOld": (u: SessionUser) => {
    if (u.role !== "state") throw bad("Only State can clear files.");
    const cut = Date.now() - 365 * 864e5; let n = 0;
    db().letters.forEach((l) => { if (l.attachment && new Date(l.attachment.date).getTime() < cut) { l.attachment = null; n++; } });
    logAct(u, "Edit", `Cleared ${n} letter attachment(s) older than one year.`);
    return { cleared: n };
  },
};
void ROLE_NAME;
