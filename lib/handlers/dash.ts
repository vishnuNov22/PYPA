import { db } from "../db";
import { ageOn } from "../util";
import { dueInfo, eduLevel, scopeMembers, scopeUnits, unitLabel, unreadCount } from "../domain";
import type { Member, SessionUser } from "../types";

const count = (ms: Member[], fn: (m: Member) => string, labels: string[]) => labels.map((l) => ({ label: l, value: ms.filter((m) => fn(m) === l).length }));

export const dashHandlers = {
  "dash.get": (u: SessionUser) => {
    const d = db();
    const all = scopeMembers(u), ms = all.filter((m) => m.status === "Active");
    const age = (m: Member) => ageOn(m.dob);
    const ages = [
      { label: "15 – 21 years", value: ms.filter((m) => age(m) >= 15 && age(m) <= 21).length },
      { label: "22 – 30 years", value: ms.filter((m) => age(m) >= 22 && age(m) <= 30).length },
      { label: "31 – 40 years", value: ms.filter((m) => age(m) >= 31 && age(m) <= 40).length },
    ];
    const other = ms.length - ages.reduce((a, b) => a + b.value, 0);
    if (other) ages.push({ label: "Other ages", value: other });
    const charts: { id: string; title: string; data: { label: string; value: number }[] }[] = [
      { id: "gender", title: "Gender", data: count(ms, (m) => m.gender, ["Male", "Female"]) },
      { id: "age", title: "Age groups", data: ages },
      { id: "edu", title: "Education", data: count(ms, eduLevel, ["Matriculation", "Diploma", "UG", "PG", "PG Diploma", "PhD"]) },
      { id: "emp", title: "Employment", data: count(ms, (m) => m.employed, ["Employed", "Unemployed"]) },
      { id: "res", title: "Residence", data: count(ms, (m) => m.residence, ["India", "Other Countries"]) },
    ];
    if (u.role === "state") charts.push({ id: "by", title: "Members by zone", data: d.zones.map((z) => ({ label: z.name, value: ms.filter((m) => m.zone === z.id).length })) });
    if (u.role === "zone") charts.push({ id: "by", title: "Members by centre", data: d.centres.filter((c) => c.zoneId === u.unitId).map((c) => ({ label: c.name, value: ms.filter((m) => m.centre === c.id).length })) });
    if (u.role === "centre") charts.push({ id: "by", title: "Members by local PYPA", data: d.locals.filter((l) => l.centreId === u.unitId).map((l) => ({ label: l.name, value: ms.filter((m) => m.local === l.id).length })) });
    const tiles = [{ label: "Active members", value: ms.length, accent: true }, { label: "Inactive members", value: all.length - ms.length }];
    if (u.role === "state") tiles.push({ label: "Zones", value: d.zones.length }, { label: "Centres", value: d.centres.length }, { label: "Local PYPA units", value: d.locals.length });
    if (u.role === "zone") tiles.push({ label: "Centres", value: scopeUnits(u, "centre").length - 1 }, { label: "Local PYPA units", value: scopeUnits(u, "local").length });
    if (u.role === "centre") tiles.push({ label: "Local PYPA units", value: scopeUnits(u, "local").length });
    const pending: { label: string; count: number; href: string }[] = [];
    if (u.role === "state") {
      const pl = d.locals.filter((l) => l.status === "Pending Approval").length;
      const pd = d.dues.filter((x) => x.status === "Pending").length;
      const pt = d.transfers.filter((t) => t.status === "Pending").length;
      if (pl) pending.push({ label: "Local PYPA units waiting for approval", count: pl, href: "/portal/units/local" });
      if (pd) pending.push({ label: "Dues payments to verify", count: pd, href: "/portal/members/dues" });
      if (pt) pending.push({ label: "Member transfers to approve", count: pt, href: "/portal/members" });
    }
    const un = unreadCount(u);
    if (un) pending.push({ label: "Unread notifications", count: un, href: "/portal/notifications" });
    const di = dueInfo(all);
    return {
      title: u.role === "state" ? "Kerala State" : unitLabel(u.role as never, u.unitId),
      tiles, charts, pending,
      dues: { total: di.total, paidThisYear: di.total - (di.by[new Date().getFullYear()] || 0), year: new Date().getFullYear() },
    };
  },
};
