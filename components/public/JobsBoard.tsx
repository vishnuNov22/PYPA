"use client";
import { useState } from "react";
import { Briefcase, CalendarClock, MapPin, Plus, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { FormModal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { rpc } from "@/lib/client";
import { fmtDate } from "@/lib/format";
import { JOB_TYPES } from "@/lib/consts";
import type { Job } from "@/lib/types";

export function JobsBoard({ jobs }: { jobs: Job[] }) {
  const [q, setQ] = useState(""), [type, setType] = useState(""), [loc, setLoc] = useState("");
  const [post, setPost] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ type: "Full-time" });
  const types = Array.from(new Set(jobs.map((j) => j.type))), locs = Array.from(new Set(jobs.map((j) => j.loc))).sort();
  const list = jobs.filter((j) => (!type || j.type === type) && (!loc || j.loc === loc) && (!q || (j.title + j.org + j.text).toLowerCase().includes(q.toLowerCase())));
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <div className="card mb-8 flex flex-wrap items-end gap-3 p-4">
        <label className="field min-w-[220px] flex-1"><span className="lbl">Search jobs</span><span className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" /><Input className="pl-9" placeholder="Job title or organisation" value={q} onChange={(e) => setQ(e.target.value)} /></span></label>
        <Field label="Type" className="w-40"><Select blank="All types" options={types} value={type} onChange={(e) => setType(e.target.value)} /></Field>
        <Field label="Location" className="w-48"><Select blank="All locations" options={locs} value={loc} onChange={(e) => setLoc(e.target.value)} /></Field>
        <button className="btn btn-pri ml-auto" onClick={() => setPost(true)}><Plus className="h-4 w-4" />Post a job opening</button>
      </div>
      <p className="mb-4 text-sm text-mute">{list.length} opening{list.length === 1 ? "" : "s"}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((j) => (
          <article key={j.id} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-display text-2xl font-semibold">{j.title}</h3><p className="text-sm text-mute">{j.org}</p></div><span className="pill pill-info shrink-0">{j.type}</span></div>
            <p className="mt-3 text-[15px] leading-relaxed">{j.text}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
              <li className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{j.loc}</li><li className="flex items-center gap-1.5"><Wallet className="h-4 w-4" />{j.pay}</li>
              {j.deadline && <li className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />Apply by {fmtDate(j.deadline)}</li>}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm"><span className="text-mute">Posted {fmtDate(j.date)}</span><span className="font-mono text-[13px]">{j.contact}</span></div>
          </article>
        ))}
        {list.length === 0 && <div className="card col-span-full flex flex-col items-center gap-2 py-16 text-mute"><Briefcase className="h-8 w-8" />No openings match.</div>}
      </div>
      <FormModal open={post} onClose={() => setPost(false)} title="Post a job opening" size="lg" submitLabel="Send for review"
        onSubmit={async () => { try { await rpc("jobs.post", f); toast.success("Sent to the admin for review. It appears once approved."); setF({ type: "Full-time" }); } catch (e) { toast.error((e as Error).message); return false; } }}>
        <p className="text-sm text-mute">Your request goes to the PYPA admin and appears on this page after review.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" required><Input required value={f.title || ""} onChange={set("title")} /></Field>
          <Field label="Company / organisation" required><Input required value={f.org || ""} onChange={set("org")} /></Field>
          <Field label="Location" required><Input required value={f.loc || ""} onChange={set("loc")} /></Field>
          <Field label="Type"><Select options={JOB_TYPES} value={f.type} onChange={set("type")} /></Field>
          <Field label="Pay (optional)"><Input value={f.pay || ""} onChange={set("pay")} /></Field>
          <Field label="Last date to apply"><Input type="date" value={f.deadline || ""} onChange={set("deadline")} /></Field>
          <Field label="Contact email" required className="sm:col-span-2"><Input required type="email" value={f.contact || ""} onChange={set("contact")} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea value={f.text || ""} onChange={set("text")} /></Field>
        </div>
      </FormModal>
    </>
  );
}
