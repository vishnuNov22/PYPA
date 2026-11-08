"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightLeft, Check, Eye, Pencil, Plus, Receipt, CopyCheck, X } from "lucide-react";
import { useMe } from "@/components/portal/useMe";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { Avatar, Card, KV, PageHeader, StatusPill } from "@/components/ui/kit";
import { Drawer } from "@/components/ui/Drawer";
import { act, useRpc } from "@/lib/client";
import { ageOn } from "@/lib/util";
import { fmtDate } from "@/lib/format";
import { INACTIVE_REASONS } from "@/lib/consts";

interface Row { id: string; name: string; gender: string; dob: string; blood: string; status: string; reason: string; zoneId: string; zone: string; centreId: string; centre: string; localId: string; local: string; canEdit: boolean; mobile: string }
interface Tr { id: string; member: string; from: string; to: string; date: string; by: string }
const age = (r: Row) => ageOn(r.dob);

export default function Members() {
  const me = useMe();
  const { data } = useRpc<Row[]>("members.list");
  const { data: tr } = useRpc<Tr[]>("transfers.list");
  const [showTr, setShowTr] = useState(true);
  const [sel, setSel] = useState<Row | null>(null);
  const role = me?.role;
  const uniq = (k: keyof Row) => Array.from(new Set((data || []).map((r) => String(r[k])))).filter(Boolean).sort();
  const filters: TFilter<Row>[] = [
    { key: "status", label: "Status", options: ["Active", "Inactive"], test: (r, v) => r.status === v },
    { key: "reason", label: "Inactive reason", options: INACTIVE_REASONS, test: (r, v) => r.reason === v },
    ...(role === "state" ? [{ key: "zone", label: "Zone", type: "combo" as const, options: uniq("zone"), test: (r: Row, v: string) => r.zone === v }] : []),
    ...(role === "state" || role === "zone" ? [{ key: "centre", label: "Centre", type: "combo" as const, options: uniq("centre"), test: (r: Row, v: string) => r.centre === v }] : []),
    ...(role !== "local" ? [{ key: "local", label: "Local PYPA", type: "combo" as const, options: uniq("local"), test: (r: Row, v: string) => r.local === v }] : []),
    { key: "gender", label: "Gender", options: ["Male", "Female"], test: (r, v) => r.gender === v },
    { key: "age", label: "Age group", options: ["15-21", "22-30", "31-40", "Over 40"], test: (r, v) => { const a = age(r); return v === "15-21" ? a <= 21 : v === "22-30" ? a >= 22 && a <= 30 : v === "31-40" ? a >= 31 && a <= 40 : a > 40; } },
    { key: "blood", label: "Blood group", options: uniq("blood"), test: (r, v) => r.blood === v },
  ];
  const cols: Col<Row>[] = [
    { key: "id", label: "Member ID", sortable: true, get: (r) => r.id, className: "font-mono text-xs whitespace-nowrap" },
    { key: "name", label: "Name", sortable: true, get: (r) => r.name, render: (r) => <Link href={`/portal/members/${r.id}`} className="font-semibold hover:text-brand hover:underline">{r.name}</Link> },
    { key: "gender", label: "Gender", sortable: true, get: (r) => r.gender, hide: "sm" },
    { key: "age", label: "Age", sortable: true, get: age, className: "tabular-nums", hide: "sm" },
    ...(role === "state" || role === "zone" ? [{ key: "centre", label: "Centre", sortable: true, get: (r: Row) => r.centre, hide: "md" as const }] : []),
    ...(role !== "local" ? [{ key: "local", label: "Local PYPA", sortable: true, get: (r: Row) => r.local, hide: "md" as const }] : []),
    ...(role === "state" || role === "local" ? [{ key: "mobile", label: "Mobile", get: (r: Row) => r.mobile, className: "font-mono text-xs", hide: "md" as const }] : []),
    { key: "status", label: "Status", sortable: true, get: (r) => r.status, render: (r) => <span className="inline-flex items-center gap-2"><StatusPill s={r.status} />{r.reason && <span className="text-xs text-mute">{r.reason}</span>}</span> },
  ];
  const canAdd = role === "state" || role === "local";
  return (
    <>
      <PageHeader title="Members" sub={`${data?.length ?? "…"} members in your scope. Inactive members are shaded.`}
        actions={<>
          <Link href="/portal/members/dues" className="btn"><Receipt className="h-4 w-4" />Dues</Link>
          {role !== "zone" && <Link href="/portal/members/duplicates" className="btn"><CopyCheck className="h-4 w-4" />Duplicates</Link>}
          {canAdd && <Link href="/portal/members/new" className="btn btn-pri"><Plus className="h-4 w-4" />Add member</Link>}
        </>} />
      {tr && tr.length > 0 && (
        <Card title={`Transfer requests (${tr.length})`} className="mb-5" actions={<button className="btn btn-sm" onClick={() => setShowTr(!showTr)}>{showTr ? "Hide" : "Show"}</button>}>
          {showTr && (
            <ul className="divide-y divide-line">
              {tr.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><b>{t.member}</b><span className="ml-2 inline-flex items-center gap-1.5 text-sm text-mute"><ArrowRightLeft className="h-3.5 w-3.5" />{t.from} → {t.to}</span><div className="text-xs text-mute">Requested {fmtDate(t.date)}</div></div>
                  {role === "state" ? (
                    <div className="flex gap-2"><button className="btn btn-sm btn-ok" onClick={() => act("transfers.decide", { id: t.id, approve: true }, "Transfer approved.")}><Check className="h-3.5 w-3.5" />Approve</button>
                      <button className="btn btn-sm btn-bad" onClick={() => act("transfers.decide", { id: t.id, approve: false }, "Transfer rejected.")}><X className="h-3.5 w-3.5" />Reject</button></div>
                  ) : <span className="pill pill-warn">Awaiting State approval</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <DataTable<Row> rows={data} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.id} ${r.name} ${r.mobile} ${r.local}`} searchPlaceholder="Search by ID, name or mobile"
        defaultSort={["name", 1]} onRowClick={setSel} rowClass={(r) => (r.status === "Inactive" ? "bg-bad-soft/40 text-mute" : undefined)}
        exportName="Members" exportCols={[["Member ID", (r) => r.id], ["Name", (r) => r.name], ["Gender", (r) => r.gender], ["Date of birth", (r) => r.dob], ["Age", age], ["Blood group", (r) => r.blood], ["Zone", (r) => r.zone], ["Centre", (r) => r.centre], ["Local PYPA", (r) => r.local], ...(role === "state" || role === "local" ? [["Mobile", (r: Row) => r.mobile] as [string, (r: Row) => string]] : []), ["Status", (r) => r.status], ["Reason", (r) => r.reason]]}
        actions={(r) => (<><Link href={`/portal/members/${r.id}`} className="btn btn-sm"><Eye className="h-3.5 w-3.5" />View</Link>{r.canEdit && <Link href={`/portal/members/${r.id}/edit`} className="btn btn-sm"><Pencil className="h-3.5 w-3.5" />Edit</Link>}</>)} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name || ""} subtitle={sel?.id}
        footer={sel && <><Link href={`/portal/members/${sel.id}`} className="btn btn-pri"><Eye className="h-4 w-4" />Full profile</Link>{sel.canEdit && <Link href={`/portal/members/${sel.id}/edit`} className="btn"><Pencil className="h-4 w-4" />Edit</Link>}</>}>
        {sel && <div className="grid gap-6">
          <div className="flex items-center gap-4"><Avatar name={sel.name} size={64} /><div><div className="flex flex-wrap gap-2"><StatusPill s={sel.status} />{sel.reason && <span className="pill">{sel.reason}</span>}</div><p className="mt-2 text-sm text-mute">{sel.gender} · {age(sel)} years · {sel.blood || "blood group n/a"}</p></div></div>
          <KV narrow items={[["Date of birth", fmtDate(sel.dob)], ["Local PYPA", sel.local], ["Centre", sel.centre], ["Zone", sel.zone], ...(role === "state" || role === "local" ? [["Mobile", sel.mobile] as [string, string]] : [])]} />
        </div>}
      </Drawer>
    </>
  );
}
