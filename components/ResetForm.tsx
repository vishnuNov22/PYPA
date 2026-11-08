"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rpc } from "@/lib/client";
import { Field, Input } from "./ui/Field";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [a, setA] = useState(""), [b, setB] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (a !== b) return toast.error("The two passwords differ.");
    setBusy(true);
    try { await rpc("auth.resetPassword", { token, password: a }); toast.success("Password updated. Sign in with the new password."); router.replace("/login"); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={go} className="grid gap-4">
      <Field label="New password" required hint="At least 8 characters, with letters and numbers"><Input type="password" required autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} /></Field>
      <Field label="Confirm password" required><Input type="password" required autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      <button className="btn btn-pri min-h-12" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
