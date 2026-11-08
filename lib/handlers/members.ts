import { db } from "../db";
import { addYears, uid } from "../util";
import {
  assertEditable, bad, canAddMember, canEditMember, chainOf, findDupes, forbidden, logAct, memberBy, nextMemberId, notFound, notify,
  requireRole, scopeMembers, ukey, unitBy, unitLabel,
} from "../domain";
import type { Member, SessionUser } from "../types";

const canSeeMobile = (u: SessionUser) => u.role === "state" || u.role === "local";
const FIELDS: (keyof Member)[] = ["name", "gender", "dob", "blood", "govId", "family", "father", "mother", "marital", "perm", "comm", "mobile", "email", "saved", "baptism", "from", "tenth", "twelfth", "diploma", "ug", "pg", "pgd", "phd", "employed", "occType", "occOrg", "residence", "country", "status", "reason"];

function view(u: SessionUser, m: Member) {
  return { ...m, mobile: canSeeMobile(u) ? m.mobile : "", pypaEnds: addYears(m.dob, 40) };
}
function assertMemberScope(u: SessionUser, m: Member) {
  if (u.role === "state") return;
  if (u.role === "admin" || m[u.role as "zone"] !== u.unitId) throw forbidden("That member is outside your scope.");
}

export const memberHandlers = {
  "members.list": (u: SessionUser) =>
    scopeMembers(u).map((m) => ({
      id: m.id, name: m.name, gender: m.gender, dob: m.dob, blood: m.blood, status: m.status, reason: m.reason,
      zoneId: m.zone, zone: unitBy("zone", m.zone)?.name || "", centreId: m.centre, centre: unitBy("centre", m.centre)?.name || "",
      localId: m.local, local: unitBy("local", m.local)?.name || "", canEdit: canEditMember(u, m),
      mobile: canSeeMobile(u) ? m.mobile : "",
    })),
  "members.get": (u: SessionUser, i: { id: string }) => {
    const m = memberBy(i.id);
    if (!m) throw notFound("Member not found");
    assertMemberScope(u, m);
    const pend = db().transfers.find((t) => t.memberId === m.id && t.status === "Pending");
    return {
      member: view(u, m), canEdit: canEditMember(u, m),
      zone: unitBy("zone", m.zone)?.name, centre: unitBy("centre", m.centre)?.name, local: unitBy("local", m.local)?.name,
      canTransfer: (u.role === "state" || (u.role === "local" && m.local === u.unitId)) && m.status === "Active",
      pendingTransfer: pend ? { id: pend.id, to: unitBy("local", pend.toLocal)?.name || "" } : null,
    };
  },
  "members.save": (u: SessionUser, i: { id?: string; data: Partial<Member> & { localId?: string } }) => {
    const d = db(), data = i.data || {};
    assertEditable(u);
    let m: Member | undefined;
    if (i.id) {
      m = memberBy(i.id);
      if (!m) throw notFound();
      if (!canEditMember(u, m)) throw forbidden("You cannot edit this member.");
    } else if (!canAddMember(u)) throw forbidden("You cannot add members.");
    if (!data.name?.trim()) throw bad("Enter the member name.");
    if (!data.gender) throw bad("Pick the gender.");
    if (!data.dob) throw bad("Enter the date of birth.");
    if (new Date(data.dob) > new Date()) throw bad("Date of birth cannot be in the future.");
    if (!/^[0-9+ ]{8,15}$/.test(String(data.mobile ?? (m?.mobile || "")))) { if (!(m && !canSeeMobile(u))) throw bad("Enter a valid mobile number."); }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) throw bad("Enter a valid email.");
    if (data.status === "Inactive" && !data.reason) throw bad("Pick the reason for making this member inactive.");
    const clean: Partial<Member> = {};
    FIELDS.forEach((f) => { if (data[f] !== undefined) (clean as Record<string, unknown>)[f] = typeof data[f] === "string" ? (data[f] as string).trim() : data[f]; });
    if (clean.status === "Active") clean.reason = "";
    if (m) {
      if (!canSeeMobile(u)) delete clean.mobile;
      Object.assign(m, clean);
      logAct(u, "Edit", `Edited details of ${m.name} (${m.id}).`);
      notify(u, [ukey("local", m.local), ukey("centre", m.centre)], "Member details changed", `${m.name} (${m.id}) was updated.`, `/portal/members/${m.id}`);
      return { id: m.id };
    }
    // new member: local selection decides zone and centre
    let localId = data.localId || "";
    if (u.role === "local") localId = u.unitId!;
    const l = unitBy("local", localId);
    if (!l) throw bad("Pick the local PYPA.");
    if (u.role === "centre" && l.centreId !== u.unitId) throw forbidden("That local PYPA is not under your centre.");
    const zone = unitBy("zone", l.zoneId)!;
    const nm: Member = {
      id: nextMemberId(zone.code!), photo: null, name: "", gender: "", dob: "", blood: "", govId: "", family: "", father: "", mother: "", marital: "Single",
      perm: "", comm: "", mobile: "", email: "", zone: l.zoneId!, centre: l.centreId!, local: l.id, saved: "", baptism: "", from: String(new Date().getFullYear()),
      tenth: "", twelfth: "", diploma: "", ug: "", pg: "", pgd: "", phd: "", employed: "Unemployed", occType: "", occOrg: "", residence: "India", country: "India",
      status: "Active", reason: "", paid: [], ...(clean as object),
    } as Member;
    d.members.push(nm);
    logAct(u, "Add", `Added member ${nm.name} (${nm.id}) to ${l.name}.`);
    notify(u, [ukey("local", l.id), ukey("centre", l.centreId!)], "New member added", `${nm.name} (${nm.id}) was added to ${l.name}.`, `/portal/members/${nm.id}`);
    return { id: nm.id };
  },

  /* ---------- transfers ---------- */
  "members.transfer": (u: SessionUser, i: { id: string; toLocal: string }) => {
    const m = memberBy(i.id);
    if (!m) throw notFound();
    if (u.role !== "state" && !(u.role === "local" && m.local === u.unitId)) throw forbidden("Only the member’s local PYPA or State can start a transfer.");
    assertEditable(u);
    const to = unitBy("local", i.toLocal);
    if (!to || to.status !== "Active") throw bad("Pick the local PYPA the member is moving to.");
    if (to.id === m.local) throw bad("The member already belongs to that local PYPA.");
    if (db().transfers.some((t) => t.memberId === m.id && t.status === "Pending")) throw bad("A transfer is already waiting for approval.");
    const t = { id: uid("t"), memberId: m.id, fromLocal: m.local, toLocal: to.id, by: ukey(u.role as never, u.unitId), date: new Date().toISOString(), status: "Pending" as const };
    db().transfers.unshift(t);
    if (u.role === "state") { applyTransfer(u, t); return { done: true }; }
    logAct(u, "Add", `Requested transfer of ${m.name} to ${to.name}.`);
    notify(u, ["state"], "Member transfer request", `${unitLabel("local", m.local)} requests moving ${m.name} to ${to.name}.`, "/portal/members");
    return { done: false };
  },
  "transfers.list": (u: SessionUser) => {
    const mine = db().transfers.filter((t) => t.status === "Pending" && (u.role === "state" || t.fromLocal === u.unitId || (u.role === "centre" && unitBy("local", t.fromLocal)?.centreId === u.unitId)));
    return mine.map((t) => ({ ...t, member: memberBy(t.memberId)?.name, from: unitLabel("local", t.fromLocal), to: unitLabel("local", t.toLocal) }));
  },
  "transfers.decide": (u: SessionUser, i: { id: string; approve: boolean }) => {
    requireRole(u, "state");
    const t = db().transfers.find((x) => x.id === i.id);
    if (!t || t.status !== "Pending") throw bad("This request was already handled.");
    if (i.approve) applyTransfer(u, t);
    else {
      t.status = "Rejected";
      logAct(u, "Edit", `Rejected transfer of ${memberBy(t.memberId)?.name}.`);
      notify(u, [t.by], "Transfer rejected", `The transfer of ${memberBy(t.memberId)?.name} was rejected by State.`);
    }
    return { ok: true };
  },

  /* ---------- duplicates ---------- */
  "members.dupes": (u: SessionUser) => {
    const mine = new Set(scopeMembers(u).map((m) => m.id));
    return findDupes().filter((g) => g.some((m) => mine.has(m.id))).map((g) => g.map((m) => ({
      id: m.id, name: m.name, mobile: canSeeMobile(u) ? m.mobile : `XXXXXX${m.mobile.slice(-4)}`, email: m.email,
      local: unitBy("local", m.local)?.name, centre: unitBy("centre", m.centre)?.name, canMark: u.role === "state" || canEditMember(u, m),
    })));
  },
  "members.markDuplicate": (u: SessionUser, i: { id: string }) => {
    const m = memberBy(i.id);
    if (!m) throw notFound();
    if (u.role !== "state" && !canEditMember(u, m)) throw forbidden();
    assertEditable(u);
    m.status = "Inactive"; m.reason = "Duplicate";
    logAct(u, "Edit", `Marked ${m.name} (${m.id}) inactive: Duplicate.`);
    notify(u, [ukey("local", m.local), ukey("centre", m.centre)], "Duplicate member handled", `${m.name} (${m.id}) was marked inactive as a duplicate.`);
    return { ok: true };
  },
};

function applyTransfer(u: SessionUser, t: { memberId: string; fromLocal: string; toLocal: string; status: string; by: string }) {
  const m = memberBy(t.memberId)!, to = unitBy("local", t.toLocal)!, from = unitBy("local", t.fromLocal)!;
  m.zone = to.zoneId!; m.centre = to.centreId!; m.local = to.id;
  t.status = "Approved";
  logAct(u, "Edit", `Transferred ${m.name} from ${from.name} to ${to.name}.`);
  notify(u, [ukey("local", from.id), ukey("local", to.id), ukey("centre", from.centreId!), ukey("centre", to.centreId!), t.by], "Member transferred", `${m.name} moved from ${from.name} to ${to.name}.`, `/portal/members/${m.id}`);
}
void chainOf;
