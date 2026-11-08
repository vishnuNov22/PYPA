"use client";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";

export class ApiError extends Error { constructor(m: string, public status: number) { super(m); } }

export async function rpc<T = unknown>(action: string, input: unknown = {}): Promise<T> {
  const r = await fetch("/api/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, input }) });
  const j = await r.json().catch(() => ({ ok: false, error: "Unexpected server reply." }));
  if (!j.ok) {
    if (r.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login")) location.href = "/login";
    throw new ApiError(j.error || "Request failed", r.status);
  }
  return j.data as T;
}
const fetcher = ([action, input]: [string, unknown]) => rpc(action, input);

export function useRpc<T = unknown>(action: string | null, input: unknown = {}, opts: { refreshInterval?: number } = {}) {
  return useSWR<T>(action ? [action, input] : null, fetcher as never, { revalidateOnFocus: false, keepPreviousData: true, ...opts });
}
/** Re-fetch every cached query (cheap: this app's lists are small). */
export const refreshAll = () => globalMutate(() => true);

/** Run a mutation with toast feedback. Returns the result or undefined on error. */
export async function act<T = unknown>(action: string, input: unknown, ok?: string | ((r: T) => string)): Promise<T | undefined> {
  try {
    const r = await rpc<T>(action, input);
    if (ok) toast.success(typeof ok === "function" ? ok(r) : ok);
    refreshAll();
    return r;
  } catch (e) {
    toast.error((e as Error).message);
    return undefined;
  }
}
export async function upload(kind: "letter" | "public", file: File) {
  const f = new FormData(); f.append("kind", kind); f.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: f });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  return j.data as { name: string; size: number; date: string; url: string };
}
