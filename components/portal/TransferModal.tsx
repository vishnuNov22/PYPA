"use client";
import { useState } from "react";
import { Combobox, Field, Select } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { act, useRpc } from "@/lib/client";

interface All { zones: { id: string; name: string }[]; centres: { id: string; name: string; zoneId: string }[]; locals: { id: string; name: string; zoneId: string; centreId: string }[] }
export function TransferModal({ open, onClose, memberId, memberName, fromLocal }: { open: boolean; onClose: () => void; memberId: string; memberName: string; fromLocal: string }) {
  const { data } = useRpc<All>(open ? "org.allLocals" : null);
  const [z, setZ] = useState(""), [c, setC] = useState(""), [l, setL] = useState("");
  const centres = (data?.centres || []).filter((x) => !z || x.zoneId === z);
  const locals = (data?.locals || []).filter((x) => x.id !== fromLocal && (!c || x.centreId === c) && (!z || x.zoneId === z));
  return (
    <FormModal open={open} onClose={onClose} title={`Transfer ${memberName}`} submitLabel="Submit transfer" onSubmit={async () => {
      if (!l) { const { toast } = await import("sonner"); toast.error("Pick the local PYPA the member is moving to."); return false; }
      const r = await act<{ done: boolean }>("members.transfer", { id: memberId, toLocal: l }, (x) => (x.done ? "Member transferred." : "Transfer request sent to State for approval."));
      return !!r;
    }}>
      <p className="text-sm text-mute">Pick the new Zone, Centre and Local PYPA. A transfer started by a local PYPA becomes effective only after State approves it.</p>
      <Field label="Zone"><Select blank="All zones" value={z} options={(data?.zones || []).map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setZ(e.target.value); setC(""); setL(""); }} /></Field>
      <Field label="Centre"><Select blank="All centres" value={c} options={centres.map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setC(e.target.value); setL(""); }} /></Field>
      <Field label="Local PYPA" required><Combobox value={l} onChange={setL} options={locals.map((x) => ({ value: x.id, label: x.name, sub: data?.centres.find((q) => q.id === x.centreId)?.name }))} /></Field>
    </FormModal>
  );
}
