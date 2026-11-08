"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { rpc } from "@/lib/client";
import { Field, Input } from "./ui/Field";
import { FormModal, Modal } from "./ui/Modal";
import { MailPreview } from "./MailPreview";
import type { Mail } from "@/lib/types";

export function LoginForm({ demos, contact }: { demos: { label: string; email: string }[]; contact: { office: string; phone: string; email: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [show, setShow] = useState(false), [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [p1, setP1] = useState(""), [p2, setP2] = useState("");
  const [forgot, setForgot] = useState(false), [fe, setFe] = useState("");
  const [forgotUn, setForgotUn] = useState(false);
  const [mail, setMail] = useState<Mail | null>(null);

  const done = (role: string) => { toast.success("Signed in"); router.replace(role === "admin" ? "/admin/users" : "/portal"); router.refresh(); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const r = await rpc<{ role?: string; mustChange?: boolean; ticket?: string }>("auth.login", { email, password: pw });
      if (r.mustChange) setTicket(r.ticket!); else done(r.role!);
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Username (email address)" required><Input type="email" autoComplete="username" required placeholder="name@example.org" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password" required>
          <span className="relative"><Input type={show ? "text" : "password"} autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} className="pr-11" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mute hover:bg-sunk" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
        </Field>
        <button className="btn btn-pri min-h-12 text-[15px]" disabled={busy}><LogIn className="h-4 w-4" />{busy ? "Signing in…" : "Sign in"}</button>
        <div className="flex flex-wrap justify-between gap-2 text-sm"><button type="button" className="link" onClick={() => { setFe(email); setForgot(true); }}>Forgot password?</button><button type="button" className="link" onClick={() => setForgotUn(true)}>Forgot username?</button></div>
      </form>

      {demos.length > 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-4">
          <b className="text-sm">Try a demo account</b><p className="mb-3 text-xs text-mute">Password for all demo accounts: <code className="font-mono">pypa@123</code></p>
          <div className="grid gap-2 sm:grid-cols-2">{demos.map((d) => <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPw("pypa@123"); }} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:border-brand hover:bg-brand-soft"><b className="block text-sm">{d.label}</b><span className="block truncate font-mono text-[11px] text-mute">{d.email}</span></button>)}</div>
        </div>
      )}

      <FormModal open={!!ticket} onClose={() => setTicket(null)} title="Set a new password" submitLabel="Save and sign in" hideCancel
        onSubmit={async () => {
          if (p1 !== p2) { toast.error("The two passwords differ."); return false; }
          try { const r = await rpc<{ role: string }>("auth.firstPassword", { ticket, password: p1 }); done(r.role); } catch (e) { toast.error((e as Error).message); return false; }
        }}>
        <p className="text-sm text-mute">This is your first sign-in. Choose a new password to continue.</p>
        <Field label="New password" required hint="At least 8 characters, with letters and numbers"><Input type="password" required autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} /></Field>
        <Field label="Confirm password" required><Input type="password" required autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} /></Field>
      </FormModal>

      <FormModal open={forgot} onClose={() => setForgot(false)} title="Reset your password" submitLabel="Send reset link"
        onSubmit={async () => { try { const r = await rpc<{ devMail?: Mail }>("auth.forgotPassword", { email: fe }); toast.success("If that address is registered, a reset email is on its way."); if (r.devMail) setMail(r.devMail); } catch (e) { toast.error((e as Error).message); return false; } }}>
        <p className="text-sm text-mute">Enter your username. If it is registered, a reset link is sent to that email address.</p>
        <Field label="Username (email)" required><Input type="email" required value={fe} onChange={(e) => setFe(e.target.value)} /></Field>
      </FormModal>

      <Modal open={forgotUn} onClose={() => setForgotUn(false)} title="Forgot your username?" footer={<button className="btn btn-pri" onClick={() => setForgotUn(false)}>Close</button>}>
        <p>Usernames are issued by the State office. Contact State and share your unit name.</p>
        <dl className="mt-4 grid gap-3 rounded-xl bg-sunk p-4 text-sm"><div><dt className="text-xs font-bold uppercase text-mute">State office</dt><dd>{contact.office}</dd></div><div><dt className="text-xs font-bold uppercase text-mute">Phone</dt><dd className="font-mono">{contact.phone}</dd></div><div><dt className="text-xs font-bold uppercase text-mute">Email</dt><dd className="font-mono">{contact.email}</dd></div></dl>
      </Modal>
      <MailPreview mail={mail} onClose={() => setMail(null)} title="Reset email" />
    </>
  );
}
