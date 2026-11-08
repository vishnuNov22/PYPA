import { db } from "../db";
import { uid } from "../util";
import {
  COLL, HttpError, assertEditable, bad, canAddUnit, canEditUnit, chainOf, createAccount, forbidden, inScopeUnit, isCurrent,
  keyLabel, logAct, memberBy, notFound, notify, requireRole, scopeMembers, scopeUnits, ukey, unitBy, unitLabel, dueInfo,
} from "../domain";
import type { Kind, SessionUser, Unit, UnitKind } from "../types";

const councilOf = (kind: UnitKind, id: string) => db().council.filter((c) => c.unitType === kind && c.unitId === id);
const pres = (kind: UnitKind, id: string) => councilOf(kind, id).filter((c) => isCurrent(c.termEnds)).find((c) => c.functionary === "President")?.name || "—";
const sec = (kind: UnitKind, id: string) => councilOf(kind, id).filter((c) => isCurrent(c.termEnds)).find((c) => c.functionary === "Secretary")?.name || "—";
const kindOf = (k: string): UnitKind => { if (!["state", "zone", "centre", "local"].includes(k)) throw bad("Unknown unit type"); return k as UnitKind; };
const BASIC = ["name", "contact", "established", "addr1", "addr2", "city", "panchayat", "taluk", "pincode"] as const;

function assertScope(u: SessionUser, kind: UnitKind, id: string) {
  if (kind === "state") { if (u.role !== "state") throw forbidden(); return; }
  if (!inScopeUnit(u, kind as Kind, id)) throw forbidden("That unit is outside your scope.");
}

export const unitHandlers = {
  "units.list": (u: SessionUser, i: { kind: Kind }) => {
    const d = db(), kind = i.kind;
    if (kind === "zone" && u.role !== "state") throw forbidden();
    if (kind === "local" && u.role === "local") throw forbidden();
    return scopeUnits(u, kind).map((x) => {
      const ms = d.members.filter((m) => m[kind] === x.id);
      const di = dueInfo(ms);
      return {
        id: x.id, name: x.name, status: x.status, registered: !!x.registered,
        zoneId: x.zoneId || (kind === "zone" ? x.id : ""), zone: kind === "zone" ? x.name : unitBy("zone", x.zoneId)?.name || "",
        centreId: x.centreId || (kind === "centre" ? x.id : ""), centre: kind === "centre" ? x.name : unitBy("centre", x.centreId)?.name || "",
        president: pres(kind, x.id), secretary: sec(kind, x.id),
        active: ms.filter((m) => m.status === "Active").length, inactive: ms.filter((m) => m.status !== "Active").length,
        pendingYears: di.pending.length, canEdit: canEditUnit(u, kind, x),
      };
    });
  },
  "units.get": (u: SessionUser, i: { kind: string; id: string }) => {
    const kind = kindOf(i.kind), id = kind === "state" ? "ST-KL" : i.id;
    assertScope(u, kind, id);
    const unit = unitBy(kind, id);
    if (!unit) throw notFound("Unit not found");
    const ms = kind === "state" ? db().members : db().members.filter((m) => m[kind as Kind] === id);
    const di = dueInfo(ms);
    const showMobile = u.role === "state" || u.role === "local" || (u.role === "centre" && kind === "local");
    return {
      kind, unit: { ...unit, admin: { ...unit.admin, mobile: showMobile ? unit.admin.mobile : "" } },
      zoneName: unitBy("zone", unit.zoneId)?.name, centreName: unitBy("centre", unit.centreId)?.name,
      council: councilOf(kind, id).sort((a, b) => b.termEnds.localeCompare(a.termEnds)).map((c) => ({ ...c, current: isCurrent(c.termEnds) })),
      active: ms.filter((m) => m.status === "Active").length, inactive: ms.filter((m) => m.status !== "Active").length,
      due: { paid: di.paid, pending: di.pending.map((y) => ({ year: y, count: di.by[y] })) },
      canEdit: kind === "state" ? u.role === "state" : canEditUnit(u, kind as Kind, unit),
      isOwn: u.role === kind && u.unitId === id,
    };
  },
  "units.update": (u: SessionUser, i: { kind: string; id: string; patch: Record<string, string>; admin?: { name?: string; mobile?: string } }) => {
    const kind = kindOf(i.kind), id = kind === "state" ? "ST-KL" : i.id;
    assertScope(u, kind, id);
    const unit = unitBy(kind, id)!;
    if (kind === "state" ? u.role !== "state" : !canEditUnit(u, kind as Kind, unit)) throw forbidden("You cannot edit this unit.");
    assertEditable(u);
    const p = i.patch || {};
    if (p.contact !== undefined && !/^[0-9+ ()-]{8,18}$/.test(p.contact)) throw bad("Enter a valid contact number.");
    if (p.pincode !== undefined && p.pincode && !/^[0-9]{6}$/.test(p.pincode)) throw bad("Pincode must be 6 digits.");
    const changed: string[] = [];
    BASIC.forEach((f) => {
      if (f === "name" && u.role === kind && u.unitId === id && kind !== "state") return; // a unit cannot rename itself
      if (p[f] !== undefined && p[f] !== (unit as never)[f]) { (unit as never)[f] = p[f] as never; changed.push(f); }
    });
    if (i.admin) {
      if (i.admin.name !== undefined) unit.admin.name = i.admin.name;
      if (i.admin.mobile !== undefined) unit.admin.mobile = i.admin.mobile;
    }
    logAct(u, "Edit", `Updated details of ${unitLabel(kind, id)}${changed.length ? ` (${changed.join(", ")})` : ""}.`);
    const to = kind === "state" ? [] : chainOf(kind, unit);
    if (!(u.role === kind && u.unitId === id)) to.push(ukey(kind, id));
    notify(u, to, "Unit details changed", `${unitLabel(kind, id)} details were updated by ${unitLabel(u.role as UnitKind, u.unitId)}.`, `/portal/units/${kind}/${id}`);
    return { ok: true };
  },
  "units.create": (u: SessionUser, i: {
    kind: Kind; unit: Record<string, string>; admin: { name: string; email: string; mobile: string }; zoneId?: string; centreId?: string;
    council?: { memberId: string; functionary: string; termEnds: string }[];
  }) => {
    const d = db(), kind = i.kind;
    if (!canAddUnit(u, kind)) throw forbidden("You cannot add this kind of unit.");
    assertEditable(u);
    const b = i.unit || {}, a = i.admin || ({} as never);
    if (!b.name?.trim()) throw bad("Enter the name.");
    if (!/^\S+@\S+\.\S+$/.test(a.email || "")) throw bad("Enter a valid admin email. It becomes the username.");
    if (d.users.some((x) => x.email.toLowerCase() === a.email.toLowerCase())) throw bad("That email is already used as a username.");
    if (d[COLL[kind]].some((x) => x.name.toLowerCase() === b.name.trim().toLowerCase() && (kind === "zone" || x.centreId === (i.centreId || (u.role === "centre" ? u.unitId : undefined))))) throw bad("A unit with this name already exists here.");
    let zoneId = "", centreId = "", parent = "PYPA Kerala State";
    if (kind === "centre") { zoneId = i.zoneId!; const z = unitBy("zone", zoneId); if (!z) throw bad("Pick the parent zone."); parent = `${z.name} Zone`; }
    if (kind === "local") {
      centreId = u.role === "centre" ? u.unitId! : i.centreId!;
      const c = unitBy("centre", centreId); if (!c) throw bad("Pick the parent centre.");
      zoneId = c.zoneId!; parent = `${c.name} Centre`;
    }
    const prefix = kind === "zone" ? "Z" : kind === "centre" ? "C" : "L";
    const nums = d[COLL[kind]].map((x) => parseInt(x.id.slice(1), 10) || 0);
    const unit: Unit = {
      id: prefix + (Math.max(0, ...nums) + 1), name: b.name.trim(), parent, contact: b.contact || "", established: b.established || "",
      addr1: b.addr1 || "", addr2: b.addr2 || "", city: b.city || "", panchayat: b.panchayat || "", taluk: b.taluk || "", pincode: b.pincode || "",
      status: kind === "local" && u.role === "centre" ? "Pending Approval" : "Active", admin: { name: a.name, email: a.email, mobile: a.mobile || "" },
      ...(kind === "zone" ? { code: (b.code || b.name.slice(0, 3)).toUpperCase() } : { zoneId }), ...(kind === "local" ? { centreId, registered: true } : {}),
    };
    d[COLL[kind]].push(unit);
    (i.council || []).forEach((c) => {
      const m = memberBy(c.memberId);
      if (m) d.council.push({ id: uid("co"), unitType: kind, unitId: unit.id, memberId: m.id, name: m.name, functionary: c.functionary, termEnds: c.termEnds });
    });
    let mail;
    if (unit.status === "Active") mail = createAccount(kind, unit);
    logAct(u, "Add", `Added ${kind} ${unit.name}${unit.status !== "Active" ? " (waiting for State approval)" : ""}.`);
    if (unit.status === "Pending Approval") notify(u, ["state"], "Local PYPA awaiting approval", `${unit.name} was added under ${unitLabel("centre", centreId)} and needs State approval.`, `/portal/units/local/${unit.id}`);
    else notify(u, chainOf(kind, unit), `New ${kind} added`, `${unit.name} was added.`, `/portal/units/${kind}/${unit.id}`);
    return { id: unit.id, pending: unit.status === "Pending Approval", devMail: mail };
  },
  "units.decideLocal": (u: SessionUser, i: { id: string; approve: boolean }) => {
    requireRole(u, "state");
    const l = unitBy("local", i.id);
    if (!l || l.status !== "Pending Approval") throw bad("This unit is not waiting for approval.");
    let mail;
    if (i.approve) { l.status = "Active"; mail = createAccount("local", l); }
    else l.status = "Rejected";
    logAct(u, "Edit", `${i.approve ? "Approved" : "Rejected"} local PYPA ${l.name}.`);
    notify(u, [ukey("centre", l.centreId!), ukey("zone", l.zoneId!)], `Local PYPA ${i.approve ? "approved" : "rejected"}`, `${l.name} was ${i.approve ? "approved" : "rejected"} by State.${i.approve ? " Login details were emailed to the administrator." : ""}`, `/portal/units/local/${l.id}`);
    return { ok: true, devMail: mail };
  },

  /* ---------- council ---------- */
  "council.list": (u: SessionUser) => {
    const kind = u.role as UnitKind, id = u.unitId || "ST-KL";
    return councilOf(kind, kind === "state" ? "ST-KL" : id).sort((a, b) => b.termEnds.localeCompare(a.termEnds)).map((c) => ({ ...c, current: isCurrent(c.termEnds) }));
  },
  "council.candidates": (u: SessionUser, i: { kind: string; id: string }) => {
    const kind = kindOf(i.kind), id = kind === "state" ? "ST-KL" : i.id;
    assertScope(u, kind, id);
    const ms = kind === "state" ? db().members : db().members.filter((m) => m[kind as Kind] === id);
    return ms.filter((m) => m.status === "Active").map((m) => ({ id: m.id, name: m.name, local: unitBy("local", m.local)?.name || "" })).sort((a, b) => a.name.localeCompare(b.name));
  },
  "council.save": (u: SessionUser, i: { kind: string; id: string; rowId?: string; memberId: string; functionary: string; termEnds: string }) => {
    const kind = kindOf(i.kind), id = kind === "state" ? "ST-KL" : i.id;
    assertScope(u, kind, id);
    const unit = unitBy(kind, id)!;
    if (kind === "state" ? u.role !== "state" : !canEditUnit(u, kind as Kind, unit)) throw forbidden();
    assertEditable(u);
    const m = memberBy(i.memberId);
    if (!m) throw bad("Pick a member from the list.");
    if (!i.functionary) throw bad("Pick a functionary.");
    if (!i.termEnds) throw bad("Enter the date the term ends.");
    const dupe = db().council.find((c) => c.unitType === kind && c.unitId === id && c.memberId === m.id && isCurrent(c.termEnds) && c.id !== i.rowId);
    if (dupe) throw bad(`${m.name} is already a current council member here.`);
    if (i.rowId) {
      const r = db().council.find((c) => c.id === i.rowId)!;
      Object.assign(r, { memberId: m.id, name: m.name, functionary: i.functionary, termEnds: i.termEnds });
    } else db().council.push({ id: uid("co"), unitType: kind, unitId: id, memberId: m.id, name: m.name, functionary: i.functionary, termEnds: i.termEnds });
    logAct(u, i.rowId ? "Edit" : "Add", `${i.rowId ? "Updated" : "Added"} council: ${m.name} as ${i.functionary} in ${unitLabel(kind, id)}.`);
    notify(u, kind === "state" ? [] : [...chainOf(kind, unit), ukey(kind, id)], "Council updated", `${unitLabel(kind, id)} council: ${m.name} (${i.functionary}).`, `/portal/units/${kind}/${id}`);
    return { ok: true };
  },
  "council.remove": (u: SessionUser, i: { kind: string; id: string; rowId: string }) => {
    const kind = kindOf(i.kind), id = kind === "state" ? "ST-KL" : i.id;
    assertScope(u, kind, id);
    const unit = unitBy(kind, id)!;
    if (kind === "state" ? u.role !== "state" : !canEditUnit(u, kind as Kind, unit)) throw forbidden();
    assertEditable(u);
    const r = db().council.find((c) => c.id === i.rowId && c.unitType === kind && c.unitId === id);
    if (!r) throw notFound();
    db().council = db().council.filter((c) => c !== r);
    logAct(u, "Edit", `Removed ${r.name} (${r.functionary}) from the council of ${unitLabel(kind, id)}.`);
    return { ok: true };
  },
};
void HttpError; void keyLabel; void scopeMembers;
