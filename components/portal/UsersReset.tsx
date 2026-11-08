"use client";
import { useState } from "react";
import { KeyRound, UserCog } from "lucide-react";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { Field, Input } from "@/components/ui/Field";
import { FormModal, Modal } from "@/components/ui/Modal";
import { MailPreview } from "@/components/MailPreview";
import { Pill } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import type { Mail } from "@/lib/types";

interface U { id: string; name: string; email: string; role: string; roleName: string; zone: string; mustChange: boolean }

export function UsersReset() {
  const { data } = useRpc<U[]>("users.list");
  const [rename, setRename] = useState<U | null>(null);
  const [email, setEmail] = useState("");
  const [reset, setReset] = useState<U | null>(null);
  const [mail, setMail] = useState<Mail | null>(null);
  const filters: TFilter<U>[] = [
    { key: "role", label: "Role", options: Array.from(new Set((data || []).map((u) => u.roleName))), test: (r, v) => r.roleName === v },
    { key: "zone", label: "Zone", type: "combo", options: Array.from(new Set((data || []).map((u) => u.zone))).filter(Boolean).sort(), test: (r, v) => r.zone === v },
  ];
  const cols: Col<U>[] = [
    { key: "name", label: "Unit / user", sortable: true, get: (r) => r.name, render: (r) => <b>{r.name}</b> },
    { key: "role", label: "Role", sortable: true, get: (r) => r.roleName },
    { key: "zone", label: "Zone", get: (r) => r.zone, hide: "md" },
    { key: "email", label: "Username (email)", sortable: true, get: (r) => r.email, className: "font-mono text-xs" },
    { key: "pw", label: "Password", get: (r) => (r.mustChange ? "Temporary" : "Set"), render: (r) => <Pill tone={r.mustChange ? "warn" : "ok"}>{r.mustChange ? "Temporary" : "Set"}</Pill>, hide: "sm" },
  ];
  return (
    <>
      <DataTable<U> rows={data} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.name} ${r.email}`} searchPlaceholder="Search unit or email" defaultSort={["name", 1]}
        actions={(r) => (<><button className="btn btn-sm" onClick={() => { setRename(r); setEmail(r.email); }}><UserCog className="h-3.5 w-3.5" />Change username</button><button className="btn btn-sm" onClick={() => setReset(r)}><KeyRound className="h-3.5 w-3.5" />Reset password</button></>)} />
      <FormModal open={!!rename} onClose={() => setRename(null)} title="Change username" size="sm" submitLabel="Change & email"
        onSubmit={async () => { const r = await act<{ devMail?: Mail }>("users.changeUsername", { id: rename!.id, email }, "Username changed. A temporary password was emailed."); if (r?.devMail) setMail(r.devMail); return !!r; }}>
        <p className="text-sm text-mute">The new address becomes the login for <b>{rename?.name}</b>. A temporary password is emailed to it and must be changed at the next sign-in.</p>
        <Field label="New username (email)" required><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      </FormModal>
      <Modal open={!!reset} onClose={() => setReset(null)} title="Reset password" size="sm" footer={<><button className="btn" onClick={() => setReset(null)}>Cancel</button>
        <button className="btn btn-pri" onClick={async () => { const r = await act<{ devMail?: Mail }>("users.resetPassword", { id: reset!.id }, "Password reset. A temporary password was emailed."); if (r?.devMail) setMail(r.devMail); if (r) setReset(null); }}>Reset & email</button></>}>
        <p className="text-sm">Send a new temporary password to <b>{reset?.email}</b>? The old password stops working immediately.</p>
      </Modal>
      <MailPreview mail={mail} onClose={() => setMail(null)} />
    </>
  );
}
