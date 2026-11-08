"use client";
import { useState } from "react";
import { Calculator, Check, X } from "lucide-react";
import { DuesCalc } from "@/components/portal/DuesCalc";
import { useMe } from "@/components/portal/useMe";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { Field, Textarea } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { PageHeader, StatusPill } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { fmtDT, inr } from "@/lib/format";
import type { Due } from "@/lib/types";

type Row = Due & { zoneName: string; centreName: string; localName: string };

export default function Dues() {
  const me = useMe();
  const { data } = useRpc<Row[]>("dues.list");
  const [calc, setCalc] = useState(false);
  const [dec, setDec] = useState<{ row: Row; approve: boolean } | null>(null);
  const [remarks, setRemarks] = useState("");
  const role = me?.role;
  const uniq = (k: keyof Row) => Array.from(new Set((data || []).map((r) => String(r[k])))).filter((v) => v && v !== "—").sort();
  const filters: TFilter<Row>[] = [
    { key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"], test: (r, v) => r.status === v },
    { key: "mode", label: "Payment mode", options: ["Online", "Offline"], test: (r, v) => r.mode === v },
    { key: "by", label: "Paid by", options: ["Zone", "Centre", "Local"], test: (r, v) => r.paidBy === v },
    ...(role === "state" ? [{ key: "zone", label: "Zone", type: "combo" as const, options: uniq("zoneName"), test: (r: Row, v: string) => r.zoneName === v }] : []),
    { key: "from", label: "From date", type: "date", test: (r, v) => r.date.slice(0, 10) >= v },
    { key: "to", label: "To date", type: "date", test: (r, v) => r.date.slice(0, 10) <= v },
  ];
  const cols: Col<Row>[] = [
    { key: "date", label: "Date", sortable: true, get: (r) => r.date, render: (r) => <span className="whitespace-nowrap">{fmtDT(r.date)}</span> },
    { key: "unit", label: "Paid by", sortable: true, get: (r) => r.unitName, render: (r) => <><b>{r.unitName}</b><span className="ml-2 text-xs text-mute">{r.paidBy}</span></> },
    { key: "yrs", label: "Years", get: (r) => r.years.join(", "), hide: "md" },
    { key: "count", label: "Members", sortable: true, get: (r) => r.count, className: "tabular-nums", hide: "sm" },
    { key: "amount", label: "Amount", sortable: true, get: (r) => r.amount, render: (r) => <b className="tabular-nums">{inr(r.amount)}</b> },
    { key: "mode", label: "Mode", get: (r) => r.mode, hide: "sm" },
    { key: "ref", label: "Reference", get: (r) => r.ref || "—", className: "font-mono text-xs", hide: "md" },
    { key: "status", label: "Status", get: (r) => r.status, render: (r) => <div><StatusPill s={r.status} />{r.remarks && <p className="mt-1 max-w-[220px] text-xs text-mute">{r.remarks}</p>}</div> },
  ];
  return (
    <>
      <PageHeader title="Member dues" sub="Payment requests and their approval status. Zone, centre and local units pay; State verifies." actions={<button className="btn btn-pri" onClick={() => setCalc(true)}><Calculator className="h-4 w-4" />Dues calculation</button>} />
      <DataTable<Row> rows={data} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.unitName} ${r.ref || ""}`} searchPlaceholder="Search unit or reference" defaultSort={["date", -1]}
        exportName="Dues payments" exportCols={[["Date", (r) => r.date.slice(0, 10)], ["Unit", (r) => r.unitName], ["Paid by", (r) => r.paidBy], ["Zone", (r) => r.zoneName], ["Years", (r) => r.years.join(", ")], ["Members", (r) => r.count], ["Amount", (r) => r.amount], ["Mode", (r) => r.mode], ["Reference", (r) => r.ref || ""], ["Status", (r) => r.status], ["Remarks", (r) => r.remarks]]}
        actions={role === "state" ? (r) => r.status === "Pending" ? (<><button className="btn btn-sm btn-ok" onClick={() => { setRemarks(""); setDec({ row: r, approve: true }); }}><Check className="h-3.5 w-3.5" />Approve</button><button className="btn btn-sm btn-bad" onClick={() => { setRemarks(""); setDec({ row: r, approve: false }); }}><X className="h-3.5 w-3.5" />Reject</button></>) : null : undefined} />
      <DuesCalc open={calc} onClose={() => setCalc(false)} />
      <FormModal open={!!dec} onClose={() => setDec(null)} size="sm" danger={dec ? !dec.approve : false} title={dec?.approve ? "Approve payment" : "Reject payment"} submitLabel={dec?.approve ? "Approve" : "Reject"}
        onSubmit={async () => !!(await act("dues.decide", { id: dec!.row.id, approve: dec!.approve, remarks }, dec!.approve ? "Payment approved. Member years updated." : "Payment rejected."))}>
        {dec && <p className="text-sm"><b>{dec.row.unitName}</b> paid <b>{inr(dec.row.amount)}</b> by {dec.row.mode.toLowerCase()} (ref <span className="font-mono">{dec.row.ref}</span>) for {dec.row.years.join(", ")}.</p>}
        <Field label="Remarks" hint="Shown to the unit in its notification."><Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
      </FormModal>
    </>
  );
}
