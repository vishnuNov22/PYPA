"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CouncilTable, type CouncilRow } from "@/components/portal/UnitBits";
import { Field, Input } from "@/components/ui/Field";
import { Banner, Card, PageHeader } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import type { Unit } from "@/lib/types";

interface Res { kind: string; unit: Unit; council: CouncilRow[]; canEdit: boolean; isOwn: boolean }
const LABEL: Record<string, string> = { state: "State", zone: "Zone", centre: "Centre", local: "Local PYPA" };

export default function UnitEdit() {
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const router = useRouter();
  const { data: r, error } = useRpc<Res>("units.get", { kind, id });
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (r) setF({ ...Object.fromEntries(["name", "contact", "established", "addr1", "addr2", "city", "panchayat", "taluk", "pincode"].map((k) => [k, (r.unit as never)[k] ?? ""])), adminName: r.unit.admin.name, adminMobile: r.unit.admin.mobile }); }, [r]);
  if (error) return <Card><p className="text-bad">{(error as Error).message}</p></Card>;
  if (!r) return <div className="h-64 animate-pulse rounded-2xl bg-sunk" />;
  if (!r.canEdit) return <Banner tone="warn">You can view this unit but not edit it.</Banner>;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const nameLocked = r.isOwn && r.kind !== "state";
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { adminName, adminMobile, ...patch } = f;
    const ok = await act("units.update", { kind, id, patch, admin: { name: adminName, mobile: adminMobile } }, "Details saved. Parent bodies were notified.");
    setBusy(false);
    if (ok) router.push(`/portal/units/${kind}/${id}`);
  }
  return (
    <>
      <PageHeader title={`Edit ${LABEL[r.kind]}`} sub={`${r.unit.name}. The ID and parent body cannot be changed.`} crumbs={[{ label: LABEL[r.kind], href: `/portal/units/${kind}/${id}` }, { label: "Edit" }]} />
      <form onSubmit={save} className="grid gap-5">
        <Card title="Basic details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ID" readonlyNote><Input readOnly value={r.unit.id} /></Field>
            <Field label="Parent governing body" readonlyNote><Input readOnly value={r.unit.parent} /></Field>
            <Field label={`${LABEL[r.kind]} name`} required readonlyNote={nameLocked}><Input required readOnly={nameLocked} value={f.name || ""} onChange={set("name")} /></Field>
            <Field label="Contact number" required><Input required pattern="[0-9+ ()\-]{8,18}" value={f.contact || ""} onChange={set("contact")} /></Field>
            <Field label="Established on"><Input type="date" value={f.established || ""} onChange={set("established")} /></Field>
            <Field label="Address line 1"><Input value={f.addr1 || ""} onChange={set("addr1")} /></Field>
            <Field label="Address line 2"><Input value={f.addr2 || ""} onChange={set("addr2")} /></Field>
            <Field label="City / town"><Input value={f.city || ""} onChange={set("city")} /></Field>
            <Field label="Panchayat / municipality"><Input value={f.panchayat || ""} onChange={set("panchayat")} /></Field>
            <Field label="Taluk"><Input value={f.taluk || ""} onChange={set("taluk")} /></Field>
            <Field label="Pincode"><Input inputMode="numeric" pattern="[0-9]{6}" value={f.pincode || ""} onChange={set("pincode")} /></Field>
          </div>
        </Card>
        <Card title="Admin">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Admin name"><Input value={f.adminName || ""} onChange={set("adminName")} /></Field>
            <Field label="Username (email)" readonlyNote hint="State can change usernames from Admin Panel."><Input readOnly value={r.unit.admin.email} /></Field>
            <Field label="Mobile"><Input value={f.adminMobile || ""} onChange={set("adminMobile")} /></Field>
          </div>
        </Card>
        <div className="flex gap-3"><button className="btn btn-pri" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button><button type="button" className="btn" onClick={() => router.back()}>Cancel</button></div>
      </form>
      <Card title="Council" className="mt-5"><p className="mb-4 text-sm text-mute">Add or change office-bearers. Changes here save immediately.</p><CouncilTable kind={r.kind} id={r.unit.id} rows={r.council} editable /></Card>
    </>
  );
}
void toast;
