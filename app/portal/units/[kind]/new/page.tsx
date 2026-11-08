"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Combobox, Field, Input, Select } from "@/components/ui/Field";
import { Banner, Card, PageHeader } from "@/components/ui/kit";
import { MailPreview } from "@/components/MailPreview";
import { act, useRpc } from "@/lib/client";
import { useMe } from "@/components/portal/useMe";
import { FUNCS } from "@/lib/consts";
import type { Mail } from "@/lib/types";

const LABEL: Record<string, string> = { zone: "Zone", centre: "Centre", local: "Local PYPA" };
interface Tree { zones: { id: string; name: string }[]; centres: { id: string; name: string; zoneId: string }[] }

export default function UnitNew() {
  const { kind } = useParams<{ kind: string }>();
  const router = useRouter();
  const me = useMe();
  const { data: tree } = useRpc<Tree>("org.tree");
  const [f, setF] = useState<Record<string, string>>({});
  const [council, setCouncil] = useState<{ memberId: string; functionary: string; termEnds: string }[]>([]);
  const [mail, setMail] = useState<Mail | null>(null);
  const [busy, setBusy] = useState(false);
  const scope = me?.role === "centre" ? { kind: "centre", id: me.unitId } : { kind: "state", id: "ST-KL" };
  const { data: cands } = useRpc<{ id: string; name: string; local: string }[]>(me ? "council.candidates" : null, scope);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const byCentre = me?.role === "centre" && kind === "local";
  const opts = (cands || []).map((c) => ({ value: c.id, label: c.name, sub: c.local }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { adminName, adminEmail, adminMobile, zoneId, centreId, ...unit } = f;
    const r = await act<{ id: string; pending: boolean; devMail?: Mail }>("units.create", { kind, unit, admin: { name: adminName, email: adminEmail, mobile: adminMobile }, zoneId, centreId, council: council.filter((c) => c.memberId) },
      (x) => (x.pending ? "Added. State must approve this local PYPA before it can sign in." : "Added. A welcome email with a temporary password was sent."));
    setBusy(false);
    if (!r) return;
    if (r.devMail) { setMail(r.devMail); } else router.push(r.pending ? "/portal/units/local" : `/portal/units/${kind}/${r.id}`);
  }
  return (
    <>
      <PageHeader title={`Add ${LABEL[kind]}`} sub={byCentre ? "A local PYPA added by a centre needs State approval before its admin can sign in." : "The admin receives a welcome email with a temporary password and must change it at first sign-in."} crumbs={[{ label: LABEL[kind], href: `/portal/units/${kind}` }, { label: "Add" }]} />
      {byCentre && <div className="mb-5"><Banner tone="info">This local PYPA will be created as <b>Pending Approval</b>. State is notified automatically.</Banner></div>}
      <form onSubmit={save} className="grid gap-5">
        <Card title="Basic details"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={`${LABEL[kind]} name`} required><Input required value={f.name || ""} onChange={set("name")} /></Field>
          {kind === "zone" && <Field label="Short code" required hint="Used in member ids, e.g. KTM"><Input required maxLength={4} value={f.code || ""} onChange={set("code")} /></Field>}
          {kind === "centre" && <Field label="Parent zone" required><Select required blank="Select zone" options={(tree?.zones || []).map((z) => ({ value: z.id, label: z.name }))} value={f.zoneId || ""} onChange={set("zoneId")} /></Field>}
          {kind === "local" && !byCentre && <Field label="Parent centre" required><Select required blank="Select centre" options={(tree?.centres || []).map((c) => ({ value: c.id, label: c.name }))} value={f.centreId || ""} onChange={set("centreId")} /></Field>}
          <Field label="Contact number" required><Input required pattern="[0-9+ ()\-]{8,18}" value={f.contact || ""} onChange={set("contact")} /></Field>
          <Field label="Established on"><Input type="date" value={f.established || ""} onChange={set("established")} /></Field>
          <Field label="Address line 1"><Input value={f.addr1 || ""} onChange={set("addr1")} /></Field><Field label="Address line 2"><Input value={f.addr2 || ""} onChange={set("addr2")} /></Field>
          <Field label="City / town"><Input value={f.city || ""} onChange={set("city")} /></Field><Field label="Panchayat / municipality"><Input value={f.panchayat || ""} onChange={set("panchayat")} /></Field>
          <Field label="Taluk"><Input value={f.taluk || ""} onChange={set("taluk")} /></Field><Field label="Pincode"><Input inputMode="numeric" pattern="[0-9]{6}" value={f.pincode || ""} onChange={set("pincode")} /></Field>
        </div></Card>
        <Card title="Admin"><div className="grid gap-4 sm:grid-cols-3">
          <Field label="Admin name" required><Input required value={f.adminName || ""} onChange={set("adminName")} /></Field>
          <Field label="Admin email (username)" required><Input required type="email" value={f.adminEmail || ""} onChange={set("adminEmail")} /></Field>
          <Field label="Mobile"><Input value={f.adminMobile || ""} onChange={set("adminMobile")} /></Field></div></Card>
        <Card title="Council" actions={<button type="button" className="btn btn-sm" onClick={() => setCouncil([...council, { memberId: "", functionary: FUNCS[Math.min(council.length, 2)], termEnds: "" }])}><Plus className="h-4 w-4" />Add row</button>}>
          {council.length === 0 && <p className="text-sm text-mute">Optional. You can also add council members after the unit is created.</p>}
          <div className="grid gap-3">{council.map((c, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[2fr_1.2fr_1fr_auto]">
              <Field label={i === 0 ? "Member" : undefined}><Combobox options={opts} value={c.memberId} onChange={(v) => setCouncil(council.map((x, j) => (j === i ? { ...x, memberId: v } : x)))} /></Field>
              <Field label={i === 0 ? "Functionary" : undefined}><Select options={FUNCS} value={c.functionary} onChange={(e) => setCouncil(council.map((x, j) => (j === i ? { ...x, functionary: e.target.value } : x)))} /></Field>
              <Field label={i === 0 ? "Term ends on" : undefined}><Input type="date" required value={c.termEnds} onChange={(e) => setCouncil(council.map((x, j) => (j === i ? { ...x, termEnds: e.target.value } : x)))} /></Field>
              <button type="button" className="btn btn-bad" aria-label="Remove row" onClick={() => setCouncil(council.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button></div>))}</div></Card>
        <div className="flex gap-3"><button className="btn btn-pri" disabled={busy}>{busy ? "Saving…" : `Add ${LABEL[kind]}`}</button><button type="button" className="btn" onClick={() => router.back()}>Cancel</button></div>
      </form>
      <MailPreview mail={mail} onClose={() => { setMail(null); router.push("/portal/units/" + kind); }} title="Welcome email" />
    </>
  );
}
void toast;
