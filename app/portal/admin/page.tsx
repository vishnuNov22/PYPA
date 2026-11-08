"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, CalendarClock, CopyCheck, KeyRound, Pencil, Play, Plus, Snowflake, Trash2, Trophy } from "lucide-react";
import { UsersReset } from "@/components/portal/UsersReset";
import { useMe } from "@/components/portal/useMe";
import { Field, Input, MultiSelect, Select, Textarea } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { Banner, Card, Empty, PageHeader, StatusPill, Tabs } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { fmtDate, fmtDT } from "@/lib/format";
import type { Freeze, TalentCategory, TalentEvent } from "@/lib/types";

type Tab = "freeze" | "age" | "dupes" | "talent" | "reset";
const TABS: { id: Tab; label: string }[] = [{ id: "freeze", label: "Edit freeze" }, { id: "age", label: "Member age over" }, { id: "dupes", label: "Duplicate check" }, { id: "talent", label: "Talent test" }, { id: "reset", label: "Reset username / password" }];

export default function AdminPanelPage() { return <Suspense fallback={null}><Panel /></Suspense>; }

function Panel() {
  const me = useMe();
  const router = useRouter();
  const sp = useSearchParams();
  const tab = (TABS.some((t) => t.id === sp.get("tab")) ? sp.get("tab") : "freeze") as Tab;
  if (me && me.role !== "state") return <Banner tone="warn">The Admin Panel is available to State only.</Banner>;
  return (
    <>
      <PageHeader title="Admin panel" sub="State-level controls that apply to every zone, centre and local PYPA." />
      <div className="mb-5 overflow-x-auto"><Tabs value={tab} onChange={(t) => router.replace(`/portal/admin?tab=${t}`)} tabs={TABS} /></div>
      {tab === "freeze" && <FreezeTab />}{tab === "age" && <AgeTab />}{tab === "dupes" && <DupesTab />}{tab === "talent" && <TalentTab />}{tab === "reset" && <UsersReset />}
    </>
  );
}

const nowLocal = (off = 0) => new Date(Date.now() + off - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function FreezeTab() {
  const { data } = useRpc<{ active: Freeze | null; rows: (Freeze & { status: string })[] }>("freeze.list");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ start: nowLocal(), end: nowLocal(86400000), remarks: "" });
  return (
    <Card title="Edit freeze" actions={<button className="btn btn-pri btn-sm" onClick={() => { setF({ start: nowLocal(), end: nowLocal(86400000), remarks: "" }); setOpen(true); }}><Plus className="h-4 w-4" />Add freeze</button>}>
      <p className="mb-4 text-sm text-mute">While a freeze is active, zones, centres and local PYPA can view data but cannot add or edit anything. State is never frozen.</p>
      {data?.active && <div className="mb-4"><Banner tone="warn">Editing is frozen until <b>{fmtDT(data.active.end)}</b>{data.active.remarks && ` — ${data.active.remarks}`}</Banner></div>}
      {!data ? <div className="h-24 animate-pulse rounded-xl bg-sunk" /> : data.rows.length === 0 ? <Empty icon={<Snowflake className="h-8 w-8" />}>No freezes scheduled.</Empty> : (
        <div className="scroll-thin overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[560px] text-sm"><thead><tr className="bg-sunk/70 text-left text-xs uppercase tracking-wider text-mute"><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Remarks</th><th className="px-4 py-3">Status</th><th /></tr></thead>
          <tbody>{data.rows.map((r) => <tr key={r.id} className="border-t border-line"><td className="px-4 py-3">{fmtDT(r.start)}</td><td className="px-4 py-3">{fmtDT(r.end)}</td><td className="px-4 py-3">{r.remarks || "—"}</td><td className="px-4 py-3"><StatusPill s={r.status} /></td>
            <td className="px-4 py-3 text-right">{r.status !== "Ended" && <button className="btn btn-sm btn-bad" onClick={() => act("freeze.end", { id: r.id }, "Freeze ended.")}><Ban className="h-3.5 w-3.5" />End now</button>}</td></tr>)}</tbody></table></div>
      )}
      <FormModal open={open} onClose={() => setOpen(false)} title="Add edit freeze" submitLabel="Freeze editing" onSubmit={async () => !!(await act("freeze.add", { ...f, start: new Date(f.start).toISOString(), end: new Date(f.end).toISOString() }, "Freeze scheduled. All units were notified."))}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Starts" required><Input required type="datetime-local" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field><Field label="Ends" required><Input required type="datetime-local" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field></div>
        <Field label="Remarks"><Textarea rows={3} value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} placeholder="e.g. Year-end data audit" /></Field>
      </FormModal>
    </Card>
  );
}

function AgeTab() {
  const { data } = useRpc<{ over: number; turning: number; last: string | null }>("age.status");
  const [ask, dialog] = useConfirm();
  return (
    <Card title="Member age over">{dialog}
      <p className="text-sm text-mute">Every 31 December, active members older than 40 are made inactive with the reason “Age Over”. You can also run it now.</p>
      <div className="mt-5 grid max-w-xl grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-sunk p-5"><b className="font-display text-4xl tabular-nums">{data?.over ?? "…"}</b><p className="mt-1 text-xs text-mute">Active members over 40</p></div>
        <div className="rounded-2xl bg-sunk p-5"><b className="font-display text-4xl tabular-nums">{data?.turning ?? "…"}</b><p className="mt-1 text-xs text-mute">Turning 40 this year</p></div>
      </div>
      <p className="mt-4 text-sm text-mute">Last run: {data?.last ? fmtDT(data.last) : "never"}</p>
      <button className="btn btn-pri mt-4" disabled={!data?.over} onClick={async () => { if (await ask("Run age-over process", `${data?.over} active member(s) over 40 will be marked inactive (Age Over). Continue?`, "Run now")) act<{ n: number }>("age.run", {}, (r) => `${r.n} member${r.n === 1 ? "" : "s"} moved to inactive.`); }}><Play className="h-4 w-4" />Run now</button>
    </Card>
  );
}

function DupesTab() {
  const { data } = useRpc<{ groups: number; last: string | null }>("dupes.summary");
  const { data: g } = useRpc<{ id: string; name: string; mobile: string; local: string; centre: string }[][]>("members.dupes");
  return (
    <div className="grid gap-5">
      <Card title="Duplicate member check">
        <p className="text-sm text-mute">Runs automatically every month. Matching names with the same mobile number or email are flagged and the local PYPAs are notified.</p>
        <p className="mt-3 text-sm">Open groups: <b>{data?.groups ?? "…"}</b> · Last run: {data?.last ? fmtDT(data.last) : "never"}</p>
        <button className="btn btn-pri mt-4" onClick={() => act<{ n: number }>("dupes.run", {}, (r) => `${r.n} group${r.n === 1 ? "" : "s"} found; locals notified.`)}><CopyCheck className="h-4 w-4" />Run check now</button>
      </Card>
      {g && g.length > 0 && (
        <Card title={`Flagged groups (${g.length})`}><ul className="divide-y divide-line">{g.slice(0, 40).map((grp, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><b>{grp[0].name}</b><p className="text-xs text-mute">{grp.map((m) => `${m.id} (${m.local})`).join(" · ")}</p></div>
            <button className="btn btn-sm" onClick={() => act("dupes.notify", { ids: grp.map((m) => m.id) }, "Locals notified.")}>Notify locals</button></li>))}</ul></Card>
      )}
    </div>
  );
}

function TalentTab() {
  const { data } = useRpc<{ categories: TalentCategory[]; events: TalentEvent[] }>("talent.overview");
  const [cat, setCat] = useState<Partial<TalentCategory> | null>(null);
  const [ev, setEv] = useState<Partial<TalentEvent> | null>(null);
  const [ask, dialog] = useConfirm();
  const cats = data?.categories || [];
  return (
    <div className="grid gap-5">{dialog}
      <Card title="Categories (by date of birth)" actions={<button className="btn btn-sm btn-pri" onClick={() => setCat({ name: "", from: "", to: "" })}><Plus className="h-4 w-4" />Add category</button>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cats.map((c) => (
          <div key={c.id} className="rounded-2xl border border-line p-4"><b>{c.name}</b><p className="mt-1 text-sm text-mute">Born {fmtDate(c.from)} – {fmtDate(c.to)}</p>
            <div className="mt-3 flex gap-1.5"><button className="btn btn-sm" onClick={() => setCat(c)}><Pencil className="h-3.5 w-3.5" /></button><button className="btn btn-sm btn-bad" onClick={async () => { if (await ask("Delete category", `Delete ${c.name}?`, "Delete", true)) act("talent.catDelete", { id: c.id }, "Deleted."); }}><Trash2 className="h-3.5 w-3.5" /></button></div></div>))}</div>
      </Card>
      <Card title="Events" actions={<button className="btn btn-sm btn-pri" onClick={() => setEv({ name: "", gender: "Both", type: "Individual", cats: [], n: 1 })}><Plus className="h-4 w-4" />Add event</button>}>
        <div className="scroll-thin overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-[640px] text-sm"><thead><tr className="bg-sunk/70 text-left text-xs uppercase tracking-wider text-mute"><th className="px-4 py-3">Event</th><th className="px-4 py-3">Gender</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Categories</th><th className="px-4 py-3">Per unit</th><th /></tr></thead>
          <tbody>{(data?.events || []).map((e) => <tr key={e.id} className="border-t border-line"><td className="px-4 py-3 font-semibold">{e.name}</td><td className="px-4 py-3">{e.gender}</td><td className="px-4 py-3">{e.type}</td><td className="px-4 py-3">{e.cats.map((c) => cats.find((x) => x.id === c)?.name).filter(Boolean).join(", ")}</td><td className="px-4 py-3 tabular-nums">{e.n}</td>
            <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1.5"><button className="btn btn-sm" onClick={() => setEv(e)}><Pencil className="h-3.5 w-3.5" /></button><button className="btn btn-sm btn-bad" onClick={async () => { if (await ask("Delete event", `Delete ${e.name} and its entries?`, "Delete", true)) act("talent.eventDelete", { id: e.id }, "Deleted."); }}><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div>
      </Card>
      <FormModal open={!!cat} onClose={() => setCat(null)} title={cat?.id ? "Edit category" : "Add category"} size="sm" onSubmit={async () => !!(await act("talent.catSave", cat, "Category saved."))}>
        <Field label="Name" required><Input required value={cat?.name || ""} onChange={(e) => setCat({ ...cat, name: e.target.value })} placeholder="e.g. Junior" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Born from" required><Input required type="date" value={cat?.from || ""} onChange={(e) => setCat({ ...cat, from: e.target.value })} /></Field><Field label="Born to" required><Input required type="date" value={cat?.to || ""} onChange={(e) => setCat({ ...cat, to: e.target.value })} /></Field></div>
      </FormModal>
      <FormModal open={!!ev} onClose={() => setEv(null)} title={ev?.id ? "Edit event" : "Add event"} onSubmit={async () => !!(await act("talent.eventSave", ev, "Event saved."))}>
        <Field label="Event name" required><Input required value={ev?.name || ""} onChange={(e) => setEv({ ...ev, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Gender"><Select options={["Both", "Male", "Female"]} value={ev?.gender || "Both"} onChange={(e) => setEv({ ...ev, gender: e.target.value as never })} /></Field>
          <Field label="Type"><Select options={["Individual", "Common", "Group"]} value={ev?.type || "Individual"} onChange={(e) => setEv({ ...ev, type: e.target.value as never })} /></Field>
          <Field label={ev?.type === "Group" ? "Max group size" : "Participants per unit"}><Input type="number" min={1} value={ev?.n ?? 1} onChange={(e) => setEv({ ...ev, n: +e.target.value })} /></Field></div>
        <Field label="Categories" required><MultiSelect noAll placeholder="Select categories" options={cats.map((c) => ({ value: c.id, label: c.name }))} value={ev?.cats || []} onChange={(v) => setEv({ ...ev, cats: v || [] })} /></Field>
      </FormModal>
    </div>
  );
}
void CalendarClock; void KeyRound; void Trophy;
