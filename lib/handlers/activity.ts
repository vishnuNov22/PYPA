import { db } from "../db";
import type { SessionUser } from "../types";

export const activityHandlers = {
  "activity.list": (u: SessionUser) =>
    db().activity.filter((a) => u.role === "state" || u.role === "admin" || (u.role === "zone" ? a.zoneId === u.unitId : a.role === u.role && a.unitId === u.unitId)).slice(0, 1500),
};
