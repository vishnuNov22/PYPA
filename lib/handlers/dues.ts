import { db } from "../db";
import { uid } from "../util";
import { assertEditable, bad, dueInfo, forbidden, logAct, notify, requireRole, scopeMembers, ukey, unitBy, unitLabel, ROLE_NAME } from "../domain";
import type { Due, Member, SessionUser } from "../types";

const scopeDues = (u: SessionUser) => {
  const d = db().dues;
  if (u.role === "state") return d;
  return d.filter((x) => (u.role === "zone" ? x.zone === u.unitId : u.role === "centre" ? x.centre === u.unitId : x.local === u.unitId));
};
function select(u: SessionUser, f: { zone?: string; centre?: string; local?: string }): Member[] {
  let ms = scopeMembers(u);
  if (f.zone) ms = ms.filter((m) => m.zone === f.zone);
  if (f.centre) ms = ms.filter((m) => m.centre === f.centre);
  if (f.local) ms = ms.filter((m) => m.local === f.local);
  return ms;
}
export const dueHandlers = {
  "dues.list": (u: SessionUser) =>
    scopeDues(u).sort((a, b) => b.date.localeCompare(a.date)).map((x) => ({
      ...x, zoneName: unitBy("zone", x.zone)?.name || "—", centreName: x.centre ? unitBy("centre", x.centre)?.name : "—", localName: x.local ? unitBy("local", x.local)?.name : "—",
    })),
  "dues.calc": (u: SessionUser, i: { zone?: string; centre?: string; local?: string }) => {
    const fee = db().master.fee, di = dueInfo(select(u, i));
    return { fee, total: di.total, due: di.due, rows: di.pending.map((y) => ({ year: y, members: di.by[y], amount: di.by[y] * fee })), amount: di.pending.reduce((a, y) => a + di.by[y] * fee, 0) };
  },
  "dues.pay": (u: SessionUser, i: { zone?: string; centre?: string; local?: string; mode: "Online" | "Offline"; ref: string }) => {
    if (u.role === "state") throw forbidden("State approves payments. Zones, centres and locals submit them.");
    assertEditable(u);
    if (!i.ref?.trim()) throw bad("Enter the transaction or receipt reference.");
    const ms = select(u, i), di = dueInfo(ms);
    if (!di.due) throw bad("Nothing is due for this selection.");
    const fee = db().master.fee, amount = di.pending.reduce((a, y) => a + di.by[y] * fee, 0);
    const z = i.zone || (u.role === "zone" ? u.unitId! : ""), c = i.centre || (u.role === "centre" ? u.unitId! : ""), l = i.local || (u.role === "local" ? u.unitId! : "");
    const nm = l ? unitLabel("local", l) : c ? unitLabel("centre", c) : z ? unitLabel("zone", z) : unitLabel(u.role as never, u.unitId);
    const zid = z || (c ? unitBy("centre", c)!.zoneId! : l ? unitBy("local", l)!.zoneId! : "");
    const rec: Due = {
      id: uid("d"), date: new Date().toISOString(), role: u.role, unitId: u.unitId!, zone: zid, centre: c || (l ? unitBy("local", l)!.centreId! : ""), local: l,
      paidBy: ROLE_NAME[u.role], unitName: nm, mode: i.mode, ref: i.ref.trim(), years: di.pending.slice(), count: di.due, amount, status: "Pending", remarks: "",
      // remember exactly which members this payment covers
      ...({ memberIds: ms.filter((m) => m.status === "Active").map((m) => m.id) } as object),
    };
    db().dues.unshift(rec);
    logAct(u, "Add", `Submitted dues payment of ₹${amount} for ${nm}.`);
    notify(u, ["state"], "Fee payment request", `${nm} submitted ₹${amount.toLocaleString("en-IN")} for verification.`, "/portal/members/dues");
    return { id: rec.id, amount };
  },
  "dues.decide": (u: SessionUser, i: { id: string; approve: boolean; remarks?: string }) => {
    requireRole(u, "state");
    const x = db().dues.find((q) => q.id === i.id) as (Due & { memberIds?: string[] }) | undefined;
    if (!x || x.status !== "Pending") throw bad("This request was already handled.");
    x.status = i.approve ? "Approved" : "Rejected";
    x.remarks = i.remarks?.trim() || "";
    if (i.approve) {
      const ids = new Set(x.memberIds || []);
      db().members.filter((m) => m.status === "Active" && (ids.size ? ids.has(m.id) : x.local ? m.local === x.local : x.centre ? m.centre === x.centre : m.zone === x.zone))
        .forEach((m) => x.years.forEach((y) => { if (y >= +m.from && !m.paid.includes(y)) m.paid.push(y); }));
    }
    logAct(u, "Edit", `${x.status} dues payment of ${x.unitName} (₹${x.amount}).`);
    notify(u, [ukey(x.role as never, x.unitId)], `Fee payment ${x.status.toLowerCase()}`,
      (i.approve ? "Your fee payment request has been approved. Thank you for your payment." : "Your fee payment request has been rejected. Please review and resubmit.") + (x.remarks ? ` Remarks: ${x.remarks}` : ""), "/portal/members/dues");
    return { ok: true };
  },
};
