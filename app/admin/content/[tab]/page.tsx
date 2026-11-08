"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, FileUp, ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { Card, Empty, PageHeader, StatusPill } from "@/components/ui/kit";
import { act, upload, useRpc } from "@/lib/client";
import { JOB_TYPES, PROJECT_COLORS, WALL_TYPES } from "@/lib/consts";
import { fmtDate } from "@/lib/format";
import type { Content, Issue, Job, Project, WallItem } from "@/lib/types";

const TITLES: Record<string, [string, string]> = {
  home: ["Home page", "The headline, tagline and banner image on the public home page."],
  about: ["About page", "Mission, vision and history shown on the About page."],
  leadership: ["Leadership & contact", "Contact details and social links. Office-bearers come from the State council."],
  projects: ["Ongoing projects", "Programmes shown on the Ongoing Projects page."],
  kahalam: ["Yuvajana Kahalam", "Upload each issue as a PDF. It opens in the on-site reader."],
  wall: ["Wall", "Creative work from members: poems, stories, paintings and photos."],
  jobs: ["Job portal", "Approve job requests from the public page, add openings or remove them."],
};

export default function ContentPage() {
  const { tab } = useParams<{ tab: string }>();
  const { data } = useRpc<Content>("content.get");
  const [t, sub] = TITLES[tab] || ["Content", ""];
  return (
    <>
      <PageHeader title={t} sub={sub} crumbs={[{ label: "Content management" }, { label: t }]} />
      {!data ? <div className="h-64 animate-pulse rounded-2xl bg-sunk" /> : tab === "home" ? <HomeForm c={data} /> : tab === "about" ? <AboutForm c={data} /> : tab === "leadership" ? <LeaderForm c={data} /> :
        tab === "projects" ? <Projects c={data} /> : tab === "kahalam" ? <Kahalam c={data} /> : tab === "wall" ? <Wall c={data} /> : tab === "jobs" ? <Jobs c={data} /> : <Card>Unknown section.</Card>}
    </>
  );
}

/* ---------- reusable file picker ---------- */
function FilePick({ value, onChange, accept, label, image }: { value?: string | null; onChange: (url: string | null) => void; accept: string; label: string; image?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border border-dashed border-line p-4">
      <input ref={ref} type="file" accept={accept} hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
        setBusy(true);
        try { const r = await upload("public", f); onChange(r.url); toast.success("Uploaded."); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
      }} />
      <div className="flex flex-wrap items-center gap-3">
        {image && value && /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-16 w-24 rounded-lg object-cover" />}
        {!image && value && <a href={value} target="_blank" rel="noopener noreferrer" className="link text-sm">View uploaded file</a>}
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => ref.current?.click()}>{image ? <ImageUp className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}{busy ? "Uploading…" : value ? `Replace ${label}` : `Upload ${label}`}</button>
        {value && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(null)}><X className="h-4 w-4" />Remove</button>}
      </div>
    </div>
  );
}

/* ---------- single-object sections ---------- */
function HomeForm({ c }: { c: Content }) {
  const [f, setF] = useState(c.home);
  useEffect(() => setF(c.home), [c.home]);
  return (
    <Card><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); act("content.saveSection", { section: "home", data: f }, "Home page saved."); }}>
      <Field label="Small heading above title"><Input value={f.kicker} onChange={(e) => setF({ ...f, kicker: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Headline, line 1"><Input value={f.headline1} onChange={(e) => setF({ ...f, headline1: e.target.value })} /></Field><Field label="Headline, line 2 (highlighted)"><Input value={f.headline2} onChange={(e) => setF({ ...f, headline2: e.target.value })} /></Field></div>
      <Field label="Tagline (English)"><Textarea rows={3} value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} /></Field>
      <Field label="Tagline (Malayalam)"><Textarea rows={3} className="font-ml" value={f.subMl} onChange={(e) => setF({ ...f, subMl: e.target.value })} /></Field>
      <Field label="Hero banner image (optional)"><FilePick image accept=".jpg,.jpeg,.png,.webp" label="banner" value={f.banner} onChange={(u) => setF({ ...f, banner: u })} /></Field>
      <div><button className="btn btn-pri">Save home page</button></div>
    </form></Card>
  );
}
function AboutForm({ c }: { c: Content }) {
  const [f, setF] = useState(c.about);
  useEffect(() => setF(c.about), [c.about]);
  const setH = (i: number, k: 0 | 1, v: string) => setF({ ...f, history: f.history.map((h, j) => (j === i ? (k ? [h[0], v] : [v, h[1]]) : h)) as [string, string][] });
  return (
    <Card><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); act("content.saveSection", { section: "about", data: f }, "About page saved."); }}>
      <Field label="Introduction"><Textarea rows={3} value={f.stands} onChange={(e) => setF({ ...f, stands: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Mission"><Textarea rows={3} value={f.mission} onChange={(e) => setF({ ...f, mission: e.target.value })} /></Field><Field label="Vision"><Textarea rows={3} value={f.vision} onChange={(e) => setF({ ...f, vision: e.target.value })} /></Field></div>
      <div><p className="lbl mb-2">History timeline</p>
        <div className="grid gap-3">{f.history.map((h, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[200px_1fr_auto]"><Input aria-label="Heading" placeholder="Year / heading" value={h[0]} onChange={(e) => setH(i, 0, e.target.value)} /><Input aria-label="Text" placeholder="What happened" value={h[1]} onChange={(e) => setH(i, 1, e.target.value)} />
            <button type="button" className="btn btn-bad" aria-label="Remove" onClick={() => setF({ ...f, history: f.history.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button></div>))}</div>
        <button type="button" className="btn btn-sm mt-3" onClick={() => setF({ ...f, history: [...f.history, ["", ""]] })}><Plus className="h-4 w-4" />Add milestone</button></div>
      <div><button className="btn btn-pri">Save about page</button></div>
    </form></Card>
  );
}
function LeaderForm({ c }: { c: Content }) {
  const [f, setF] = useState(c.leadership);
  useEffect(() => setF(c.leadership), [c.leadership]);
  return (
    <Card><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); act("content.saveSection", { section: "leadership", data: f }, "Leadership page saved."); }}>
      <Field label="Intro note"><Textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <Field label="State office address"><Textarea rows={2} value={f.office} onChange={(e) => setF({ ...f, office: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
      <div><p className="lbl mb-2">Social links</p><div className="grid gap-3">{f.social.map((s, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]"><Input aria-label="Name" placeholder="Facebook" value={s[0]} onChange={(e) => setF({ ...f, social: f.social.map((x, j) => (j === i ? [e.target.value, x[1]] : x)) as [string, string][] })} />
          <Input aria-label="URL" type="url" placeholder="https://…" value={s[1]} onChange={(e) => setF({ ...f, social: f.social.map((x, j) => (j === i ? [x[0], e.target.value] : x)) as [string, string][] })} />
          <button type="button" className="btn btn-bad" aria-label="Remove" onClick={() => setF({ ...f, social: f.social.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button></div>))}</div>
        <button type="button" className="btn btn-sm mt-3" onClick={() => setF({ ...f, social: [...f.social, ["", ""]] })}><Plus className="h-4 w-4" />Add link</button></div>
      <p className="text-sm text-mute">Office-bearers on this page come from the State council (Portal → Council Members).</p>
      <div><button className="btn btn-pri">Save</button></div>
    </form></Card>
  );
}

/* ---------- list sections ---------- */
type List = "projects" | "wall" | "kahalam" | "jobs";
function useItemEditor<T extends { id?: string }>(list: List, blank: T) {
  const [item, setItem] = useState<T | null>(null);
  const [ask, dialog] = useConfirm();
  const save = async () => !!(await act("content.saveItem", { list, item }, "Saved."));
  const remove = async (id: string, label: string) => { if (await ask("Delete", `Delete “${label}”? This removes it from the public site.`, "Delete", true)) act("content.deleteItem", { list, id }, "Deleted."); };
  return { item, setItem, save, remove, dialog, add: () => setItem({ ...blank }) };
}
const Row = ({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) => <li className="flex flex-wrap items-center justify-between gap-3 py-3.5"><div className="min-w-0 flex-1">{children}</div><div className="flex gap-1.5">{actions}</div></li>;
const EditDel = ({ onEdit, onDel }: { onEdit: () => void; onDel: () => void }) => <><button className="btn btn-sm" onClick={onEdit} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button><button className="btn btn-sm btn-bad" onClick={onDel} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button></>;

function Projects({ c }: { c: Content }) {
  const e = useItemEditor<Partial<Project>>("projects", { title: "", tag: "", status: "Ongoing", color: PROJECT_COLORS[0], text: "", when: "" });
  const it = e.item;
  return (
    <Card actions={<button className="btn btn-pri btn-sm" onClick={e.add}><Plus className="h-4 w-4" />Add project</button>}>{e.dialog}
      {c.projects.length === 0 ? <Empty>No projects yet.</Empty> : <ul className="divide-y divide-line">{c.projects.map((p) => <Row key={p.id} actions={<EditDel onEdit={() => e.setItem(p)} onDel={() => e.remove(p.id, p.title)} />}><div className="flex items-center gap-3"><span className="h-8 w-1.5 rounded-full" style={{ background: p.color }} /><div><b>{p.title}</b><p className="text-sm text-mute">{p.tag} · {p.status} · {p.when}</p></div></div></Row>)}</ul>}
      <FormModal open={!!it} onClose={() => e.setItem(null)} title={it?.id ? "Edit project" : "Add project"} onSubmit={e.save}>
        <Field label="Title" required><Input required value={it?.title || ""} onChange={(x) => e.setItem({ ...it, title: x.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Tag"><Input value={it?.tag || ""} onChange={(x) => e.setItem({ ...it, tag: x.target.value })} placeholder="Health" /></Field>
          <Field label="Status"><Select options={["Ongoing", "Planning", "Completed"]} value={it?.status || "Ongoing"} onChange={(x) => e.setItem({ ...it, status: x.target.value })} /></Field>
          <Field label="When"><Input value={it?.when || ""} onChange={(x) => e.setItem({ ...it, when: x.target.value })} placeholder="Jan – Dec 2026" /></Field></div>
        <Field label="Colour"><div className="flex gap-2">{PROJECT_COLORS.map((col) => <button type="button" key={col} aria-label={col} onClick={() => e.setItem({ ...it, color: col })} className={`h-8 w-8 rounded-full border-2 ${it?.color === col ? "border-ink" : "border-transparent"}`} style={{ background: col }} />)}</div></Field>
        <Field label="Description"><Textarea rows={4} value={it?.text || ""} onChange={(x) => e.setItem({ ...it, text: x.target.value })} /></Field>
      </FormModal>
    </Card>
  );
}
function Kahalam({ c }: { c: Content }) {
  const e = useItemEditor<Partial<Issue>>("kahalam", { title: "Yuvajana Kahalam", issue: "", color: PROJECT_COLORS[0], headline: "", lead: "", pdf: null });
  const it = e.item;
  return (
    <Card actions={<button className="btn btn-pri btn-sm" onClick={e.add}><Plus className="h-4 w-4" />Add issue</button>}>{e.dialog}
      {c.kahalam.length === 0 ? <Empty>No issues yet.</Empty> : <ul className="divide-y divide-line">{c.kahalam.map((k) => <Row key={k.id} actions={<EditDel onEdit={() => e.setItem(k)} onDel={() => e.remove(k.id, `${k.title} ${k.issue}`)} />}><b>{k.title} · {k.issue}</b><p className="text-sm text-mute">{k.headline} — {k.pdf ? "PDF uploaded" : "no PDF yet (sample pages shown)"}</p></Row>)}</ul>}
      <FormModal open={!!it} onClose={() => e.setItem(null)} title={it?.id ? "Edit issue" : "Add issue"} onSubmit={e.save}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Magazine title" required><Input required value={it?.title || ""} onChange={(x) => e.setItem({ ...it, title: x.target.value })} /></Field><Field label="Issue" required><Input required value={it?.issue || ""} onChange={(x) => e.setItem({ ...it, issue: x.target.value })} placeholder="November 2026" /></Field></div>
        <Field label="Cover headline"><Input value={it?.headline || ""} onChange={(x) => e.setItem({ ...it, headline: x.target.value })} /></Field>
        <Field label="Lead paragraph (cover)"><Textarea rows={3} value={it?.lead || ""} onChange={(x) => e.setItem({ ...it, lead: x.target.value })} /></Field>
        <Field label="Issue PDF"><FilePick accept=".pdf,application/pdf" label="PDF" value={it?.pdf} onChange={(u) => e.setItem({ ...it, pdf: u })} /></Field>
      </FormModal>
    </Card>
  );
}
function Wall({ c }: { c: Content }) {
  const e = useItemEditor<Partial<WallItem>>("wall", { title: "", author: "", unit: "", type: WALL_TYPES[0], text: "", seed: Math.floor(Math.random() * 9999), img: null });
  const it = e.item;
  return (
    <Card actions={<button className="btn btn-pri btn-sm" onClick={e.add}><Plus className="h-4 w-4" />Add item</button>}>{e.dialog}
      {c.wall.length === 0 ? <Empty>The wall is empty.</Empty> : <ul className="divide-y divide-line">{c.wall.map((w) => <Row key={w.id} actions={<EditDel onEdit={() => e.setItem(w)} onDel={() => e.remove(w.id, w.title)} />}><b>{w.title}</b><p className="text-sm text-mute">{w.type} · {w.author}{w.unit && `, ${w.unit}`}</p></Row>)}</ul>}
      <FormModal open={!!it} onClose={() => e.setItem(null)} title={it?.id ? "Edit item" : "Add to the wall"} onSubmit={e.save}>
        <Field label="Title" required><Input required value={it?.title || ""} onChange={(x) => e.setItem({ ...it, title: x.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Type"><Select options={WALL_TYPES} value={it?.type || WALL_TYPES[0]} onChange={(x) => e.setItem({ ...it, type: x.target.value })} /></Field><Field label="Author" required><Input required value={it?.author || ""} onChange={(x) => e.setItem({ ...it, author: x.target.value })} /></Field><Field label="Local PYPA"><Input value={it?.unit || ""} onChange={(x) => e.setItem({ ...it, unit: x.target.value })} /></Field></div>
        <Field label="Text (for poems and stories)"><Textarea rows={5} value={it?.text || ""} onChange={(x) => e.setItem({ ...it, text: x.target.value })} /></Field>
        <Field label="Image (for paintings and photos)"><FilePick image accept=".jpg,.jpeg,.png,.webp" label="image" value={it?.img} onChange={(u) => e.setItem({ ...it, img: u })} /></Field>
      </FormModal>
    </Card>
  );
}
function Jobs({ c }: { c: Content }) {
  const e = useItemEditor<Partial<Job>>("jobs", { title: "", org: "", loc: "", type: JOB_TYPES[0], pay: "", deadline: "", text: "", contact: "", status: "Approved" });
  const it = e.item;
  const pending = c.jobs.filter((j) => j.status === "Pending");
  return (
    <Card actions={<button className="btn btn-pri btn-sm" onClick={e.add}><Plus className="h-4 w-4" />Add opening</button>}>{e.dialog}
      {pending.length > 0 && <p className="mb-3 rounded-xl bg-warn-soft px-4 py-2.5 text-sm font-semibold text-warn">{pending.length} request{pending.length > 1 ? "s" : ""} waiting for approval</p>}
      {c.jobs.length === 0 ? <Empty>No job openings.</Empty> : <ul className="divide-y divide-line">{c.jobs.map((j) => <Row key={j.id} actions={<>{j.status === "Pending" && <button className="btn btn-sm btn-ok" onClick={() => act("jobs.approve", { id: j.id }, "Approved and published.")}><Check className="h-3.5 w-3.5" />Approve</button>}<EditDel onEdit={() => e.setItem(j)} onDel={() => e.remove(j.id, j.title)} /></>}>
        <div className="flex flex-wrap items-center gap-2"><b>{j.title}</b><StatusPill s={j.status} /></div><p className="text-sm text-mute">{j.org} · {j.loc} · {j.type} · posted {fmtDate(j.date)} · {j.contact}</p></Row>)}</ul>}
      <FormModal open={!!it} onClose={() => e.setItem(null)} title={it?.id ? "Edit opening" : "Add job opening"} onSubmit={e.save}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Job title" required><Input required value={it?.title || ""} onChange={(x) => e.setItem({ ...it, title: x.target.value })} /></Field><Field label="Organisation" required><Input required value={it?.org || ""} onChange={(x) => e.setItem({ ...it, org: x.target.value })} /></Field>
          <Field label="Location" required><Input required value={it?.loc || ""} onChange={(x) => e.setItem({ ...it, loc: x.target.value })} /></Field><Field label="Type"><Select options={JOB_TYPES} value={it?.type || JOB_TYPES[0]} onChange={(x) => e.setItem({ ...it, type: x.target.value })} /></Field>
          <Field label="Pay"><Input value={it?.pay || ""} onChange={(x) => e.setItem({ ...it, pay: x.target.value })} /></Field><Field label="Apply by"><Input type="date" value={it?.deadline || ""} onChange={(x) => e.setItem({ ...it, deadline: x.target.value })} /></Field></div>
        <Field label="Contact email" required><Input required type="email" value={it?.contact || ""} onChange={(x) => e.setItem({ ...it, contact: x.target.value })} /></Field>
        <Field label="Details"><Textarea rows={4} value={it?.text || ""} onChange={(x) => e.setItem({ ...it, text: x.target.value })} /></Field>
        <Field label="Status"><Select options={["Approved", "Pending"]} value={it?.status || "Approved"} onChange={(x) => e.setItem({ ...it, status: x.target.value as never })} /></Field>
      </FormModal>
    </Card>
  );
}
