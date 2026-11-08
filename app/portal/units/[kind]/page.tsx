"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Eye, Pencil, Plus, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { Avatar, KV, PageHeader, StatusPill } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { useMe } from "@/components/portal/useMe";

interface Row { id: string; name: string; status: string; registered: boolean; zoneId: string; zone: string; centreId: string; centre: string; president: string; secretary: string; active: number; inactive: number; pendingYears: number; canEdit: boolean }
const LABEL: Record<string, string> = { zone: "Zone", centre: "Centre", local: "Local PYPA" };

export default function UnitList() {
  const { kind } = useParams<{ kind: string }>();
  const router = useRouter();
  const me = useMe();
  const { data } = useRpc<Row[]>("units.list", { kind });
  const role = me?.role;
  const [sel, setSel] = useState<Row | null>(null);
  const canAdd = role === "state" || (role === "centre" && kind === "local");
  const filters: TFilter<Row>[] = [{ key: "status", label: "Status", options: ["Active", "Inactive", "Pending Approval", "Rejected"], test: (r, v) => r.status === v }];
  if (kind !== "zone" && role === "state") filters.push({ key: "zone", label: "Zone", type: "combo", options: Array.from(new Set((data || []).map((r) => r.zone))).sort(), test: (r, v) => r.zone === v });
  if (kind === "local" && (role === "state" || role === "zone")) filters.push({ key: "centre", label: "Centre", type: "combo", options: Array.from(new Set((data || []).map((r) => r.centre))).sort(), test: (r, v) => r.centre === v });
  const cols: Col<Row>[] = [
    { key: "name", label: `${LABEL[kind]} name`, sortable: true, get: (r) => r.name, render: (r) => <Link href={`/portal/units/${kind}/${r.id}`} className="font-semibold hover:text-brand hover:underline">{r.name}</Link> },
    ...(kind !== "zone" ? [{ key: "zone", label: "Zone", get: (r: Row) => r.zone, hide: "md" as const }] : []),
    ...(kind === "local" ? [{ key: "centre", label: "Centre", get: (r: Row) => r.centre, hide: "md" as const }] : []),
    { key: "president", label: "President", get: (r) => r.president, hide: "sm" },
    { key: "secretary", label: "Secretary", get: (r) => r.secretary, hide: "md" },
    { key: "active", label: "Active members", sortable: true, get: (r) => r.active, className: "tabular-nums" },
    { key: "inactive", label: "Inactive", sortable: true, get: (r) => r.inactive, className: "tabular-nums", hide: "md" },
    { key: "status", label: "Status", get: (r) => r.status, render: (r) => <StatusPill s={r.status} /> },
  ];
  return (
    <>
      <PageHeader title={`${LABEL[kind]} list`} sub={`${data?.length ?? "…"} ${LABEL[kind].toLowerCase()} unit${data?.length === 1 ? "" : "s"} in your scope. Click a row for a quick look.`}
        actions={canAdd ? <Link href={`/portal/units/${kind}/new`} className="btn btn-pri"><Plus className="h-4 w-4" />Add {LABEL[kind]}</Link> : undefined} />
      <DataTable<Row> rows={data} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.name} ${r.president} ${r.secretary}`} searchPlaceholder={`Search ${LABEL[kind].toLowerCase()} name or office-bearer`}
        defaultSort={["name", 1]} onRowClick={setSel} exportName={`${LABEL[kind]} list`} exportCols={[["Name", (r) => r.name], ["Zone", (r) => r.zone], ["Centre", (r) => r.centre], ["President", (r) => r.president], ["Secretary", (r) => r.secretary], ["Active members", (r) => r.active], ["Inactive members", (r) => r.inactive], ["Status", (r) => r.status]]}
        actions={(r) => (<>
          <Link href={`/portal/units/${kind}/${r.id}`} className="btn btn-sm"><Eye className="h-3.5 w-3.5" />View</Link>
          {r.canEdit && <Link href={`/portal/units/${kind}/${r.id}/edit`} className="btn btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</Link>}
          {role === "state" && r.status === "Pending Approval" && (<>
            <button className="btn btn-sm btn-ok" onClick={async () => { const x = await act<{ devMail?: unknown }>("units.decideLocal", { id: r.id, approve: true }, "Approved. Login details emailed."); if (x) router.refresh(); }}><Check className="h-3.5 w-3.5" />Approve</button>
            <button className="btn btn-sm btn-bad" onClick={() => act("units.decideLocal", { id: r.id, approve: false }, "Rejected.")}><X className="h-3.5 w-3.5" />Reject</button></>)}
        </>)} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name || ""} subtitle={`${LABEL[kind]} · ${sel?.id}`}
        footer={sel && <><Link href={`/portal/units/${kind}/${sel.id}`} className="btn btn-pri"><Eye className="h-4 w-4" />Open full details</Link>{sel.canEdit && <Link href={`/portal/units/${kind}/${sel.id}/edit`} className="btn"><Pencil className="h-4 w-4" />Edit</Link>}</>}>
        {sel && <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl bg-brand-soft p-4"><b className="font-display text-4xl text-brand tabular-nums">{sel.active}</b><p className="text-xs text-mute">Active members</p></div><div className="rounded-2xl bg-sunk p-4"><b className="font-display text-4xl tabular-nums">{sel.inactive}</b><p className="text-xs text-mute">Inactive members</p></div></div>
          <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">Office-bearers</p>
            {[["President", sel.president], ["Secretary", sel.secretary]].map(([k, v]) => <div key={k} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"><Avatar name={v || "?"} size={34} /><div><b className="block text-sm">{v || "Not set"}</b><span className="text-xs text-mute">{k}</span></div></div>)}</div>
          <KV narrow items={[["Status", <StatusPill key="s" s={sel.status} />], ["Zone", sel.zone], ...(kind === "local" ? [["Centre", sel.centre] as [string, string]] : []), ["Dues pending", sel.pendingYears ? `${sel.pendingYears} year${sel.pendingYears > 1 ? "s" : ""}` : "All paid"]]} />
        </div>}
      </Drawer>
    </>
  );
}
