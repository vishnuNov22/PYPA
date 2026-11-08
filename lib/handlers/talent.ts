import { db } from "../db";
import { uid } from "../util";
import { assertEditable, bad, chainOf, forbidden, logAct, memberBy, myKey, notify, requireRole, scopeMembers, unitBy, unitLabel } from "../domain";
import type { Member, SessionUser, TalentCategory, TalentEvent } from "../types";

const catOf = (m: Member) => db().talent.categories.find((c) => m.dob >= c.from && m.dob <= c.to);
const scopeEntries = (u: SessionUser) => {
  const ids = new Set(scopeMembers(u).map((m) => m.id));
  return db().talent.entries.filter((e) => ids.has(e.memberId));
};
function drop(memberId: string, eventId: string) {
  const T = db().talent;
  const e = T.entries.find((x) => x.memberId === memberId);
  if (!e) return;
  e.events = e.events.filter((x) => x !== eventId);
  if (!e.events.length) T.entries = T.entries.filter((x) => x !== e);
}
function add(u: SessionUser, m: Member, ev: TalentEvent) {
  const T = db().talent, c = catOf(m);
  let e = T.entries.find((x) => x.memberId === m.id);
  if (!e) { e = { id: uid("te"), memberId: m.id, category: c?.id || "", events: [], by: myKey(u), evBy: {} }; T.entries.push(e); }
  if (!e.events.includes(ev.id)) e.events.push(ev.id);
  (e.evBy ||= {})[ev.id] = myKey(u);
  logAct(u, "Add", `Entered ${m.name} for ${ev.name} in the talent test.`);
  notify(u, ["state", ...chainOf(u.role as never, unitBy(u.role as never, u.unitId)!)], "Talent test entry", `${m.name} entered for ${ev.name} by ${unitLabel(u.role as never, u.unitId)}.`, "/portal/talent");
}

export const talentHandlers = {
  "talent.overview": (u: SessionUser) => {
    const T = db().talent;
    return {
      categories: T.categories, events: T.events, myKey: myKey(u), canEnter: u.role !== "state",
      entries: scopeEntries(u).map((e) => {
        const m = memberBy(e.memberId)!;
        return { id: e.id, memberId: m.id, name: m.name, gender: m.gender, dob: m.dob, category: T.categories.find((c) => c.id === e.category)?.name || "—", categoryId: e.category,
          zone: unitBy("zone", m.zone)?.name || "", centre: unitBy("centre", m.centre)?.name || "", local: unitBy("local", m.local)?.name || "", events: e.events, evBy: e.evBy || {}, by: e.by };
      }),
      groups: T.groups.filter((g) => g.memberIds.some((id) => scopeMembers(u).some((m) => m.id === id))).map((g) => ({ ...g, members: g.memberIds.map((id) => memberBy(id)?.name || id) })),
    };
  },
  "talent.eligible": (u: SessionUser, i: { eventId: string; categoryId?: string }) => {
    const T = db().talent, ev = T.events.find((e) => e.id === i.eventId);
    if (!ev) throw bad("Unknown event");
    const have = new Set(T.entries.filter((e) => e.events.includes(ev.id)).map((e) => e.memberId));
    const cat = i.categoryId ? T.categories.find((c) => c.id === i.categoryId) : null;
    return scopeMembers(u).filter((m) => m.status === "Active" && !have.has(m.id) && (ev.gender === "Both" || m.gender === ev.gender) && (cat ? m.dob >= cat.from && m.dob <= cat.to : !!catOf(m)))
      .map((m) => ({ id: m.id, name: m.name, local: unitBy("local", m.local)?.name || "", category: catOf(m)?.name || "" })).sort((a, b) => a.name.localeCompare(b.name));
  },
  "talent.add": (u: SessionUser, i: { eventId: string; memberId: string; categoryId?: string }) => {
    if (u.role === "state" || u.role === "admin") throw forbidden("State views the entries. Zones, centres and locals enter them.");
    assertEditable(u);
    const T = db().talent, ev = T.events.find((e) => e.id === i.eventId), m = memberBy(i.memberId);
    if (!ev || !m) throw bad("Pick an event and a member.");
    if (!scopeMembers(u).includes(m)) throw forbidden("That member is outside your unit.");
    if (ev.gender !== "Both" && m.gender !== ev.gender) throw bad(`${ev.name} is for ${ev.gender.toLowerCase()} participants.`);
    const cat = catOf(m);
    if (!cat || !ev.cats.includes(cat.id)) throw bad(`${m.name} is not in a category that can enter ${ev.name}.`);
    if (i.categoryId && cat.id !== i.categoryId) throw bad(`${m.name} belongs to the ${cat.name} category.`);
    if (T.entries.some((e) => e.memberId === m.id && e.events.includes(ev.id))) throw bad(`${m.name} is already entered in ${ev.name}.`);
    const mine = T.entries.filter((e) => e.events.includes(ev.id) && (e.evBy?.[ev.id] || e.by) === myKey(u) && (ev.type === "Individual" ? e.category === cat.id : true)).length;
    if (mine >= ev.n) throw bad(`${ev.name} allows ${ev.n} participant${ev.n > 1 ? "s" : ""} per unit${ev.type === "Individual" ? " in each category" : ""}.`);
    add(u, m, ev);
    return { ok: true };
  },
  "talent.remove": (u: SessionUser, i: { memberId: string; eventId: string }) => {
    assertEditable(u);
    const e = db().talent.entries.find((x) => x.memberId === i.memberId);
    if (!e || (e.evBy?.[i.eventId] || e.by) !== myKey(u)) throw forbidden("Only the unit that entered a participant can remove them.");
    drop(i.memberId, i.eventId);
    logAct(u, "Edit", `Removed ${memberBy(i.memberId)?.name} from a talent test event.`);
    return { ok: true };
  },
  "talent.groupSave": (u: SessionUser, i: { eventId: string; name: string; memberIds: string[] }) => {
    if (u.role === "state" || u.role === "admin") throw forbidden();
    assertEditable(u);
    const T = db().talent, ev = T.events.find((e) => e.id === i.eventId);
    if (!ev || ev.type !== "Group") throw bad("Pick a group event.");
    if (!i.name?.trim()) throw bad("Enter a group name.");
    const ids = [...new Set(i.memberIds || [])];
    if (ids.length < 2) throw bad("A group needs at least two members.");
    if (ids.length > ev.n) throw bad(`${ev.name} allows up to ${ev.n} members in a group.`);
    const scope = new Set(scopeMembers(u).map((m) => m.id));
    if (ids.some((id) => !scope.has(id))) throw forbidden();
    T.groups.push({ id: uid("g"), eventId: ev.id, name: i.name.trim(), memberIds: ids, by: myKey(u) });
    ids.forEach((id) => { const m = memberBy(id)!; if (!T.entries.find((x) => x.memberId === id)?.events.includes(ev.id)) add(u, m, ev); });
    return { ok: true };
  },
  "talent.groupDelete": (u: SessionUser, i: { id: string }) => {
    assertEditable(u);
    const T = db().talent, g = T.groups.find((x) => x.id === i.id);
    if (!g || g.by !== myKey(u)) throw forbidden();
    T.groups = T.groups.filter((x) => x !== g);
    g.memberIds.forEach((id) => drop(id, g.eventId));
    return { ok: true };
  },
  /* configuration: State only */
  "talent.catSave": (u: SessionUser, i: { id?: string } & Omit<TalentCategory, "id">) => {
    requireRole(u, "state");
    if (!i.name?.trim() || !i.from || !i.to) throw bad("Fill the name and both dates.");
    if (i.to < i.from) throw bad("The end date is before the start date.");
    const T = db().talent, o = { name: i.name.trim(), from: i.from, to: i.to };
    if (i.id) Object.assign(T.categories.find((c) => c.id === i.id)!, o); else T.categories.push({ id: uid("cat"), ...o });
    logAct(u, "Edit", `Saved talent test category ${o.name}.`);
    return { ok: true };
  },
  "talent.catDelete": (u: SessionUser, i: { id: string }) => {
    requireRole(u, "state");
    const T = db().talent;
    T.categories = T.categories.filter((c) => c.id !== i.id);
    T.events.forEach((e) => (e.cats = e.cats.filter((c) => c !== i.id)));
    return { ok: true };
  },
  "talent.eventSave": (u: SessionUser, i: { id?: string } & Omit<TalentEvent, "id">) => {
    requireRole(u, "state");
    if (!i.name?.trim()) throw bad("Enter the event name.");
    if (!i.cats?.length) throw bad("Choose at least one category.");
    if (!(i.n >= 1)) throw bad("Number of participants must be at least 1.");
    const T = db().talent, o = { name: i.name.trim(), gender: i.gender, type: i.type, cats: i.cats, n: +i.n };
    if (i.id) Object.assign(T.events.find((e) => e.id === i.id)!, o); else T.events.push({ id: uid("ev"), ...o });
    logAct(u, "Edit", `Saved talent test event ${o.name}.`);
    return { ok: true };
  },
  "talent.eventDelete": (u: SessionUser, i: { id: string }) => {
    requireRole(u, "state");
    const T = db().talent;
    T.events = T.events.filter((e) => e.id !== i.id);
    T.entries.forEach((e) => (e.events = e.events.filter((x) => x !== i.id)));
    T.entries = T.entries.filter((e) => e.events.length);
    T.groups = T.groups.filter((g) => g.eventId !== i.id);
    return { ok: true };
  },
};
