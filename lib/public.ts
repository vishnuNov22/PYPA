import { db } from "./db";
import { FUNCS } from "./consts";
import { isCurrent, runScheduled } from "./domain";

export function content() { runScheduled(); return db().content; }
export function stateLeaders() {
  return db().council.filter((c) => c.unitType === "state" && isCurrent(c.termEnds)).sort((a, b) => FUNCS.indexOf(a.functionary) - FUNCS.indexOf(b.functionary));
}
export function pastLeaders() { return db().council.filter((c) => c.unitType === "state" && !isCurrent(c.termEnds)); }
export function stats() {
  const d = db();
  return { members: d.members.filter((m) => m.status === "Active").length, zones: d.zones.length, centres: d.centres.length, locals: d.locals.filter((l) => l.status === "Active").length };
}
export function zoneStats() {
  const d = db();
  return d.zones.map((z) => ({
    id: z.id, name: z.name,
    centres: d.centres.filter((c) => c.zoneId === z.id).length,
    locals: d.locals.filter((l) => l.zoneId === z.id && l.status === "Active").length,
    members: d.members.filter((m) => m.zone === z.id && m.status === "Active").length,
  }));
}
