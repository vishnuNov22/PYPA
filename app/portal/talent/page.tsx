"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useMe } from "@/components/portal/useMe";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { Combobox, Field, Input, Select } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { Banner, Card, PageHeader, Tabs } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { fmtDate } from "@/lib/format";
import type { TalentCategory, TalentEvent } from "@/lib/types";

interface Entry { id: string; memberId: string; name: string; gender: string; dob: string; category: string; categoryId: string; zone: string; centre: string; local: string; events: string[]; evBy: Record<string, string>; by: string }
interface Ov { categories: TalentCategory[]; events: TalentEvent[]; entries: Entry[]; groups: { id: string; eventId: string; name: string; members: string[]; memberIds: string[]; by: string }[]; myKey: string; canEnter: boolean }

export default function Talent() {
  const me = useMe();
  const { data } = useRpc<Ov>("talent.overview");
  const [tab, setTab] = useState<"entries" | "enter" | "groups">("entries");
  const [ask, dialog] = useConfirm();
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-sunk" />;
  const { events, categories } = data;
  const evById = Object.fromEntries(events.map((e) => [e.id, e]));

  const filters: TFilter<Entry>[] = [
    { key: "cat", label: "Category", options: categories.map((c) => c.name), test: (r, v) => r.category === v },
    { key: "gender", label: "Gender", options: ["Male", "Female"], test: (r, v) => r.gender === v },
    { key: "event", label: "Event", options: events.map((e) => ({ value: e.id, label: e.name })), test: (r, v) => r.events.includes(v) },
    ...(me?.role === "state" ? [{ key: "zone", label: "Zone", type: "combo" as const, options: Array.from(new Set(data.entries.map((e) => e.zone))).sort(), test: (r: Entry, v: string) => r.zone === v }] : []),
  ];
  const cols: Col<Entry>[] = [
    { key: "name", label: "Name", sortable: true, get: (r) => r.name, render: (r) => <b>{r.name}</b> },
    { key: "gender", label: "Gender", get: (r) => r.gender, hide: "sm" },
    { key: "cat", label: "Category", sortable: true, get: (r) => r.category },
    { key: "dob", label: "DOB", get: (r) => r.dob, render: (r) => fmtDate(r.dob), hide: "md" },
    { key: "zone", label: "Zone", get: (r) => r.zone, hide: "md" },
    { key: "centre", label: "Centre", get: (r) => r.centre, hide: "md" },
    { key: "local", label: "Local church", get: (r) => r.local, hide: "sm" },
    { key: "events", label: "Events", get: (r) => r.events.length, render: (r) => <div className="flex max-w-[320px] flex-wrap gap-1">{r.events.map((id) => <span key={id} className="pill">{evById[id]?.name || id}</span>)}</div> },
  ];
  // export layout: one column per event with a tick
  const exportCols: [string, (r: Entry) => string | number][] = [
    ["Name", (r) => r.name], ["Gender", (r) => r.gender], ["Category", (r) => r.category], ["DOB", (r) => r.dob], ["Zone", (r) => r.zone], ["Centre", (r) => r.centre], ["Local Church", (r) => r.local],
    ...events.map((e) => [e.name, (r: Entry) => (r.events.includes(e.id) ? "✓" : "")] as [string, (r: Entry) => string]),
  ];
  const tabs = [{ id: "entries" as const, label: "Entries", count: data.entries.length }, ...(data.canEnter ? [{ id: "enter" as const, label: "Enter participants" }, { id: "groups" as const, label: "Groups", count: data.groups.length }] : [])];
  return (
    <>
      {dialog}
      <PageHeader title="Talent test" sub={data.canEnter ? "Enter participants for each event. The eligible category is worked out from the date of birth." : "Entries received from all units. Download the sheet in the event-wise layout."} />
      {me?.role === "state" && <div className="mb-5"><Banner tone="info">Categories, events and participant limits are set in <b>Admin Panel → Talent test</b>.</Banner></div>}
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={tabs} /></div>
      {tab === "entries" && (
        <DataTable<Entry> rows={data.entries} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.name} ${r.local}`} searchPlaceholder="Search participant or church" defaultSort={["name", 1]}
          exportName="Talent test entries" exportCols={exportCols} empty="No entries yet."
          actions={data.canEnter ? (r) => <button className="btn btn-sm btn-bad" onClick={async () => { const mine = r.events.filter((e) => (r.evBy[e] || r.by) === data.myKey); if (!mine.length) return; if (await ask("Remove entries", `Remove ${r.name} from ${mine.map((e) => evById[e]?.name).join(", ")}?`, "Remove", true)) for (const e of mine) await act("talent.remove", { memberId: r.memberId, eventId: e }, "Removed."); }}><Trash2 className="h-3.5 w-3.5" /></button> : undefined} />
      )}
      {tab === "enter" && <Enter ov={data} />}
      {tab === "groups" && <Groups ov={data} ask={ask} />}
    </>
  );
}

function Enter({ ov }: { ov: Ov }) {
  const [ev, setEv] = useState(""), [cat, setCat] = useState(""), [mem, setMem] = useState("");
  const event = ov.events.find((e) => e.id === ev);
  const solo = event && event.type !== "Group";
  const { data: elig } = useRpc<{ id: string; name: string; local: string; category: string }[]>(solo ? "talent.eligible" : null, { eventId: ev, categoryId: event?.type === "Individual" ? cat : undefined });
  const cats = ov.categories.filter((c) => event?.cats.includes(c.id));
  const mine = event ? ov.entries.filter((e) => e.events.includes(event.id) && (e.evBy[event.id] || e.by) === ov.myKey && (event.type !== "Individual" || e.categoryId === cat)).length : 0;
  return (
    <Card title="Enter a participant">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Event" required><Select blank="Select event" value={ev} options={ov.events.filter((e) => e.type !== "Group").map((e) => ({ value: e.id, label: `${e.name} (${e.type})` }))} onChange={(e) => { setEv(e.target.value); setCat(""); setMem(""); }} /></Field>
        {event?.type === "Individual" && <Field label="Category" required><Select blank="Select category" value={cat} options={cats.map((c) => ({ value: c.id, label: c.name }))} onChange={(e) => { setCat(e.target.value); setMem(""); }} /></Field>}
        <Field label="Participant" required><Combobox value={mem} onChange={setMem} disabled={!solo || (event?.type === "Individual" && !cat)} options={(elig || []).map((m) => ({ value: m.id, label: m.name, sub: `${m.local} · ${m.category}` }))} /></Field>
      </div>
      {event && <p className="mt-4 text-sm text-mute">{event.gender === "Both" ? "Open to all genders" : `${event.gender} only`} · up to <b>{event.n}</b> per unit{event.type === "Individual" ? " in each category" : ""} · you have entered <b>{mine}</b>.</p>}
      <button className="btn btn-pri mt-5" disabled={!mem || !ev} onClick={async () => { const r = await act("talent.add", { eventId: ev, memberId: mem, categoryId: event?.type === "Individual" ? cat : undefined }, "Participant entered."); if (r) setMem(""); }}><Plus className="h-4 w-4" />Add participant</button>
    </Card>
  );
}

function Groups({ ov, ask }: { ov: Ov; ask: ReturnType<typeof useConfirm>[0] }) {
  const [open, setOpen] = useState(false);
  const [ev, setEv] = useState(""), [name, setName] = useState(""), [ids, setIds] = useState<string[]>([]), [pick, setPick] = useState("");
  const gEvents = ov.events.filter((e) => e.type === "Group");
  const event = ov.events.find((e) => e.id === ev);
  const { data: elig } = useRpc<{ id: string; name: string; local: string; category: string }[]>(open && ev ? "talent.eligible" : null, { eventId: ev });
  const names = useMemo(() => Object.fromEntries((elig || []).map((m) => [m.id, m.name])), [elig]);
  return (
    <>
      <div className="mb-4 flex justify-end"><button className="btn btn-pri" disabled={!gEvents.length} onClick={() => { setEv(gEvents[0]?.id || ""); setName(""); setIds([]); setOpen(true); }}><Users className="h-4 w-4" />New group</button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {ov.groups.map((g) => (
          <Card key={g.id} title={g.name} actions={g.by === ov.myKey ? <button className="btn btn-sm btn-bad" onClick={async () => { if (await ask("Delete group", `Delete group “${g.name}”? Its members are removed from the event.`, "Delete", true)) act("talent.groupDelete", { id: g.id }, "Group deleted."); }}><Trash2 className="h-3.5 w-3.5" /></button> : undefined}>
            <p className="text-sm text-mute">{ov.events.find((e) => e.id === g.eventId)?.name}</p><p className="mt-2 text-sm">{g.members.join(", ")}</p>
          </Card>
        ))}
        {ov.groups.length === 0 && <p className="text-sm text-mute">No groups created yet.</p>}
      </div>
      <FormModal open={open} onClose={() => setOpen(false)} title="Create group" onSubmit={async () => !!(await act("talent.groupSave", { eventId: ev, name, memberIds: ids }, "Group created."))}>
        <Field label="Group event" required><Select value={ev} options={gEvents.map((e) => ({ value: e.id, label: e.name }))} onChange={(e) => { setEv(e.target.value); setIds([]); }} /></Field>
        <Field label="Group name" required><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={`Members (2 to ${event?.n ?? "…"})`}><Combobox value={pick} onChange={(v) => { if (v && !ids.includes(v)) setIds([...ids, v]); setPick(""); }} options={(elig || []).filter((m) => !ids.includes(m.id)).map((m) => ({ value: m.id, label: m.name, sub: m.local }))} placeholder="Search to add a member" /></Field>
        <div className="flex flex-wrap gap-2">{ids.map((i) => <span key={i} className="pill">{names[i] || i}<button type="button" className="ml-1.5" aria-label="Remove" onClick={() => setIds(ids.filter((x) => x !== i))}>×</button></span>)}</div>
      </FormModal>
    </>
  );
}
