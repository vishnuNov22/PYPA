"use client";
import { useRpc } from "@/lib/client";
import type { Role } from "@/lib/types";

/** The signed-in user's role and unit, from the shell query (already cached by the layout). */
export function useMe() {
  const { data } = useRpc<{ key: string; roleName: string; label: string }>("shell.info", {}, { refreshInterval: 60000 });
  if (!data) return null;
  const [role, unitId] = data.key.split(":");
  return { role: role as Role, unitId: unitId && unitId !== "null" ? unitId : null, label: data.label };
}
