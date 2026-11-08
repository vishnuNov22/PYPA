"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { CouncilTable, type CouncilRow } from "@/components/portal/UnitBits";
import { Card, KV, PageHeader, StatusPill } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import { fmtDate } from "@/lib/format";
import type { Unit } from "@/lib/types";

interface Res {
  kind: string; unit: Unit; zoneName?: string; centreName?: string; council: CouncilRow[]; active: number; inactive: number;
  due: { paid: number[]; pending: { year: number; count: number }[] }; canEdit: boolean; isOwn: boolean;
}
const LABEL: Record<string, string> = { state: "State", zone: "Zone", centre: "Centre", local: "Local PYPA" };

export default function UnitView() {
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const { data: r, error } = useRpc<Res>("units.get", { kind, id });
  if (error) return <Card><p className="text-bad">{(error as Error).message}</p></Card>;
  if (!r) return <div className="h-64 animate-pulse rounded-2xl bg-sunk" />;
  const u = r.unit, addr = [u.addr1, u.addr2, u.city, u.panchayat, u.taluk, u.pincode].filter(Boolean).join(", ");
  return (
    <>
      <PageHeader title={r.kind === "state" ? "Kerala State" : `${u.name} ${r.kind === "zone" ? "Zone" : r.kind === "centre" ? "Centre" : ""}`.trim()} sub={`${LABEL[r.kind]} details, members, dues and council.`}
        crumbs={r.kind === "state" || r.isOwn ? [{ label: LABEL[r.kind] }, { label: "View" }] : [{ label: LABEL[r.kind], href: `/portal/units/${r.kind}` }, { label: u.name }]}
        actions={r.canEdit ? <Link href={`/portal/units/${r.kind}/${u.id}/edit`} className="btn btn-pri"><Pencil className="h-4 w-4" />Edit details</Link> : undefined} />
      <div className="grid gap-5">
        <Card title="Basic details"><KV items={[
          ["ID", <span key="i" className="font-mono">{u.id}</span>], [`${LABEL[r.kind]} name`, u.name], ["Contact number", <span key="c" className="font-mono">{u.contact}</span>], ["Parent governing body", u.parent],
          ["Established on", fmtDate(u.established)], ["Address", addr], ["Status", <StatusPill key="s" s={u.status} />],
          ...(r.zoneName && r.kind !== "zone" ? [["Zone", r.zoneName] as [string, string]] : []), ...(r.centreName && r.kind === "local" ? [["Centre", r.centreName] as [string, string]] : []),
        ]} /></Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Member details"><div className="flex gap-10"><div><b className="font-display text-5xl text-brand tabular-nums">{r.active}</b><p className="mt-1 text-sm text-mute">Active members</p></div><div><b className="font-display text-5xl tabular-nums">{r.inactive}</b><p className="mt-1 text-sm text-mute">Inactive members</p></div></div></Card>
          <Card title="Membership due">
            <p className="text-xs font-bold uppercase tracking-wider text-mute">Paid years</p>
            <div className="mt-2 flex flex-wrap gap-2">{r.due.paid.length ? r.due.paid.map((y) => <span key={y} className="pill pill-ok">{y}</span>) : <span className="text-sm text-mute">None yet</span>}</div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wider text-mute">Pending years</p>
            <div className="mt-2 flex flex-wrap gap-2">{r.due.pending.length ? r.due.pending.map((p) => <span key={p.year} className="pill pill-warn">{p.year} · {p.count} member{p.count > 1 ? "s" : ""}</span>) : <span className="text-sm text-leaf">All paid up</span>}</div>
          </Card>
        </div>
        <Card title="Council"><CouncilTable kind={r.kind} id={u.id} rows={r.council} editable={r.canEdit} /></Card>
        {r.kind !== "state" || true ? (
          <Card title="Admin panel"><p className="mb-4 text-sm text-mute">The person who signs in for this unit. The email is the username.</p>
            <KV items={[["Admin name", u.admin.name], ["Username (email)", <span key="e" className="break-all font-mono">{u.admin.email}</span>], ["Mobile", <span key="m" className="font-mono">{u.admin.mobile}</span>]]} /></Card>
        ) : null}
      </div>
    </>
  );
}
