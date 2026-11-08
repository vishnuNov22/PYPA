import { db } from "../db";
import { scopeUnits, unitLabel, myNotifs, myKey, unreadCount, activeFreeze, ROLE_NAME } from "../domain";
import type { SessionUser } from "../types";

export const orgHandlers = {
  /** Units visible to the signed-in user, for dropdowns and filters. */
  "org.tree": (u: SessionUser) => ({
    zones: scopeUnits(u, "zone").map((x) => ({ id: x.id, name: x.name })),
    centres: scopeUnits(u, "centre").map((x) => ({ id: x.id, name: x.name, zoneId: x.zoneId })),
    locals: scopeUnits(u, "local").map((x) => ({ id: x.id, name: x.name, zoneId: x.zoneId, centreId: x.centreId, registered: !!x.registered, status: x.status })),
  }),
  /** Every local unit in Kerala: used as the transfer destination. */
  "org.allLocals": () => ({
    zones: db().zones.map((x) => ({ id: x.id, name: x.name })),
    centres: db().centres.map((x) => ({ id: x.id, name: x.name, zoneId: x.zoneId })),
    locals: db().locals.filter((l) => l.status === "Active").map((x) => ({ id: x.id, name: x.name, zoneId: x.zoneId, centreId: x.centreId })),
  }),
  "shell.info": (u: SessionUser) => {
    const f = u.role === "state" || u.role === "admin" ? null : activeFreeze();
    return {
      unread: unreadCount(u),
      label: u.role === "admin" ? "Portal Administrator" : unitLabel(u.role as never, u.unitId),
      roleName: ROLE_NAME[u.role],
      freeze: f ? { remarks: f.remarks, end: f.end } : null,
      key: myKey(u),
    };
  },
  "notif.list": (u: SessionUser) => {
    const k = myKey(u);
    return myNotifs(u).slice(0, 200).map((n) => ({ ...n, read: n.readBy.includes(k) }));
  },
  "notif.read": (u: SessionUser, i: { id?: string }) => {
    const k = myKey(u);
    (i.id ? myNotifs(u).filter((n) => n.id === i.id) : myNotifs(u)).forEach((n) => { if (!n.readBy.includes(k)) n.readBy.push(k); });
    return { ok: true };
  },
};
