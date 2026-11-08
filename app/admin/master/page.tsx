"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { inr } from "@/lib/format";
import type { Master } from "@/lib/types";

export default function MasterData() {
  const { data } = useRpc<Master & { zoneCode: string }>("master.get");
  const [fmt, setFmt] = useState({ prefix: "KL", sep: "-", useZone: true, digits: 5 });
  const [fee, setFee] = useState(100);
  const [adding, setAdding] = useState<Record<string, string>>({});
  useEffect(() => { if (data) { setFmt(data.idFormat); setFee(data.fee); } }, [data]);
  const sample = fmt.prefix + (fmt.useZone ? fmt.sep + (data?.zoneCode || "KTM") : "") + fmt.sep + String(1).padStart(fmt.digits, "0");
  return (
    <>
      <PageHeader title="Master data" sub="Settings that every portal uses: member ID format, dropdown lists and the yearly membership fee." />
      <div className="grid gap-5">
        <Card title="Member ID format">
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => { e.preventDefault(); act("master.saveFormat", fmt, "ID format saved. New members will use it."); }}>
            <Field label="Prefix"><Input value={fmt.prefix} maxLength={6} onChange={(e) => setFmt({ ...fmt, prefix: e.target.value.toUpperCase() })} /></Field>
            <Field label="Separator"><Select options={["-", "/", ".", "_"]} value={fmt.sep} onChange={(e) => setFmt({ ...fmt, sep: e.target.value })} /></Field>
            <Field label="Include zone code"><Select options={[{ value: "1", label: "Yes" }, { value: "0", label: "No" }]} value={fmt.useZone ? "1" : "0"} onChange={(e) => setFmt({ ...fmt, useZone: e.target.value === "1" })} /></Field>
            <Field label="Number of digits"><Input type="number" min={3} max={8} value={fmt.digits} onChange={(e) => setFmt({ ...fmt, digits: +e.target.value })} /></Field>
            <div className="flex items-end"><button className="btn btn-pri w-full">Save format</button></div>
          </form>
          <p className="mt-4 text-sm text-mute">Next new member in a zone would get: <span className="rounded-lg bg-sunk px-3 py-1.5 font-mono font-semibold text-ink">{sample}</span>. Existing IDs never change.</p>
        </Card>
        <Card title="Membership fee">
          <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => { e.preventDefault(); act("master.saveFee", { fee }, "Fee saved."); }}>
            <Field label="Fee per member per year (₹)"><Input type="number" min={0} value={fee} onChange={(e) => setFee(+e.target.value)} /></Field>
            <button className="btn btn-pri">Save fee</button><span className="pb-2.5 text-sm text-mute">Currently {data ? inr(data.fee) : "…"} a year.</span>
          </form>
        </Card>
        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(data?.lists || {}).map(([name, vals]) => (
            <Card key={name} title={name}>
              <div className="flex flex-wrap gap-2">{vals.map((v) => <span key={v} className="pill">{v}<button className="ml-1.5 text-mute hover:text-bad" aria-label={`Remove ${v}`} onClick={() => act("master.listRemove", { list: name, value: v }, "Removed.")}><X className="h-3 w-3" /></button></span>)}</div>
              <form className="mt-4 flex gap-2" onSubmit={async (e) => { e.preventDefault(); const r = await act("master.listAdd", { list: name, value: adding[name] || "" }, "Added."); if (r) setAdding({ ...adding, [name]: "" }); }}>
                <Input placeholder={`Add to ${name}`} value={adding[name] || ""} onChange={(e) => setAdding({ ...adding, [name]: e.target.value })} /><button className="btn btn-pri" aria-label="Add"><Plus className="h-4 w-4" /></button></form>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
