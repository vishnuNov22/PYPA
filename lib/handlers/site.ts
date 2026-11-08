import { db } from "../db";
import { uid, todayISO } from "../util";
import { bad, logAct, requireRole } from "../domain";
import type { Content, SessionUser } from "../types";

type ListKey = "projects" | "wall" | "kahalam" | "jobs";
const LISTS: ListKey[] = ["projects", "wall", "kahalam", "jobs"];
const PREFIX: Record<ListKey, string> = { projects: "pr", wall: "w", kahalam: "k", jobs: "j" };

export const siteHandlers = {
  /* ---- master data ---- */
  "master.get": (u: SessionUser) => { requireRole(u, "admin"); const m = db().master; return { ...m, zoneCode: db().zones[0]?.code || "KTM" }; },
  "master.saveFormat": (u: SessionUser, i: { prefix: string; sep: string; useZone: boolean; digits: number }) => {
    requireRole(u, "admin");
    if (!/^[A-Za-z0-9]{1,6}$/.test(i.prefix || "")) throw bad("Prefix must be 1 to 6 letters or digits.");
    if (!["-", "/", ".", "_"].includes(i.sep)) throw bad("Pick a separator.");
    if (!(i.digits >= 3 && i.digits <= 8)) throw bad("Digits must be between 3 and 8.");
    db().master.idFormat = { prefix: i.prefix.toUpperCase(), sep: i.sep, useZone: !!i.useZone, digits: +i.digits };
    logAct(u, "Edit", "Changed the member id format.");
    return { ok: true };
  },
  "master.saveFee": (u: SessionUser, i: { fee: number }) => {
    requireRole(u, "admin");
    if (!(i.fee >= 0)) throw bad("Enter a valid fee.");
    db().master.fee = +i.fee; logAct(u, "Edit", `Set membership fee to ₹${i.fee}.`);
    return { ok: true };
  },
  "master.listAdd": (u: SessionUser, i: { list: string; value: string }) => {
    requireRole(u, "admin");
    const L = db().master.lists[i.list];
    if (!L) throw bad("Unknown list");
    const v = (i.value || "").trim();
    if (!v) throw bad("Enter a value.");
    if (L.some((x) => x.toLowerCase() === v.toLowerCase())) throw bad("Already in the list.");
    L.push(v);
    return { ok: true };
  },
  "master.listRemove": (u: SessionUser, i: { list: string; value: string }) => {
    requireRole(u, "admin");
    const m = db().master.lists;
    if (!m[i.list]) throw bad("Unknown list");
    m[i.list] = m[i.list].filter((x) => x !== i.value);
    return { ok: true };
  },
  "master.lists": () => db().master.lists,

  /* ---- content ---- */
  "content.get": (u: SessionUser) => { requireRole(u, "admin"); return db().content; },
  "content.saveSection": (u: SessionUser, i: { section: "home" | "about" | "leadership"; data: Record<string, unknown> }) => {
    requireRole(u, "admin");
    const c = db().content as unknown as Record<string, Record<string, unknown>>;
    if (!["home", "about", "leadership"].includes(i.section)) throw bad("Unknown section");
    c[i.section] = { ...c[i.section], ...i.data };
    logAct(u, "Edit", `Updated ${i.section} page content.`);
    return { ok: true };
  },
  "content.saveItem": (u: SessionUser, i: { list: ListKey; item: Record<string, unknown> & { id?: string } }) => {
    requireRole(u, "admin");
    if (!LISTS.includes(i.list)) throw bad("Unknown list");
    const L = db().content[i.list] as unknown as ({ id: string } & Record<string, unknown>)[];
    if (i.item.id) { const t = L.find((x) => x.id === i.item.id); if (!t) throw bad("Not found"); Object.assign(t, i.item); }
    else {
      const n = { ...i.item, id: uid(PREFIX[i.list]) } as { id: string } & Record<string, unknown>;
      if (i.list === "jobs") { n.date = todayISO(); n.status = n.status || "Approved"; }
      L.unshift(n);
    }
    logAct(u, "Edit", `Saved an item in ${i.list}.`);
    return { ok: true };
  },
  "content.deleteItem": (u: SessionUser, i: { list: ListKey; id: string }) => {
    requireRole(u, "admin");
    if (!LISTS.includes(i.list)) throw bad("Unknown list");
    const c = db().content as unknown as Record<string, { id: string }[]>;
    c[i.list] = c[i.list].filter((x) => x.id !== i.id);
    logAct(u, "Edit", `Removed an item from ${i.list}.`);
    return { ok: true };
  },
  "jobs.approve": (u: SessionUser, i: { id: string }) => {
    requireRole(u, "admin");
    const j = db().content.jobs.find((x) => x.id === i.id);
    if (!j) throw bad("Not found");
    j.status = "Approved"; logAct(u, "Edit", "Approved a job opening.");
    return { ok: true };
  },
  /* public: anyone can request a job listing; it stays Pending until the admin approves */
  "jobs.post": (_u: SessionUser | null, i: { title: string; org: string; loc: string; type: string; pay?: string; deadline?: string; contact: string; text?: string }) => {
    if (!i.title?.trim() || !i.org?.trim() || !i.loc?.trim()) throw bad("Fill the job title, organisation and location.");
    if (!/^\S+@\S+\.\S+$/.test(i.contact || "")) throw bad("Enter a contact email.");
    if (db().content.jobs.filter((j) => j.status === "Pending").length > 100) throw bad("Too many requests waiting. Try again later.");
    db().content.jobs.unshift({ id: uid("j"), title: i.title.trim().slice(0, 120), org: i.org.trim().slice(0, 120), loc: i.loc.trim().slice(0, 80), type: i.type || "Full-time", pay: (i.pay || "Not stated").slice(0, 80), date: todayISO(), deadline: i.deadline || "", text: (i.text || "").slice(0, 1200), contact: i.contact.trim(), status: "Pending" });
    return { ok: true };
  },
  "outbox.list": (u: SessionUser) => { requireRole(u, "admin"); return { mail: db().outbox.slice(0, 100), sms: db().sms.slice(0, 50) }; },
};
export type { Content };
