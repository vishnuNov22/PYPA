"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Church, GraduationCap, Home, MapPin, Save, UserRound, type LucideIcon, ClipboardCheck } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { toast } from "sonner";
import { Field, Input, Select } from "@/components/ui/Field";
import { Banner, Card } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { INACTIVE_REASONS, MARITAL } from "@/lib/consts";
import { addYears } from "@/lib/util";
import { fmtDate } from "@/lib/format";
import { useMe } from "./useMe";

type F = Record<string, string>;
const TEXT = ["name", "gender", "dob", "blood", "govId", "family", "father", "mother", "marital", "perm", "comm", "mobile", "email", "saved", "baptism", "from", "tenth", "twelfth", "diploma", "ug", "pg", "pgd", "phd", "employed", "occType", "occOrg", "residence", "country", "status", "reason"];
interface Tree { zones: { id: string; name: string }[]; centres: { id: string; name: string; zoneId: string }[]; locals: { id: string; name: string; zoneId: string; centreId: string; status: string }[] }

export function MemberForm({ id, initial }: { id?: string; initial?: F }) {
  const router = useRouter();
  const me = useMe();
  const { data: tree } = useRpc<Tree>("org.tree");
  const { data: lists } = useRpc<Record<string, string[]>>("master.lists");
  const [f, setF] = useState<F>(() => ({ gender: "", marital: "Single", employed: "Unemployed", residence: "India", country: "India", status: "Active", from: String(new Date().getFullYear()), ...initial }));
  const [z, setZ] = useState(""), [c, setC] = useState(""), [l, setL] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0), [dir, setDir] = useState(1);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (initial) setF((o) => ({ ...o, ...initial })); }, [initial]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((o) => ({ ...o, [k]: e.target.value }));
  const mobileHidden = !!id && me && me.role !== "state" && me.role !== "local";
  const ends = useMemo(() => (f.dob ? addYears(f.dob, 40) : ""), [f.dob]);
  const centres = (tree?.centres || []).filter((x) => !z || x.zoneId === z);
  const locals = (tree?.locals || []).filter((x) => x.status === "Active" && (!c || x.centreId === c) && (!z || x.zoneId === z));
  async function save() {
    if (!id && me?.role !== "local" && !l) { toast.error("Pick the local PYPA this member belongs to."); go(0); return; }
    const miss = !f.name?.trim() ? "name" : !f.gender ? "gender" : !f.dob ? "date of birth" : !mobileHidden && !f.mobile?.trim() ? "mobile number" : "";
    if (miss) { toast.error(`Please fill in the ${miss}.`); go(steps.findIndex((x) => x.key === "personal")); return; }
    setBusy(true);
    const data: Record<string, unknown> = Object.fromEntries(TEXT.filter((k) => !(k === "mobile" && mobileHidden)).map((k) => [k, f[k] ?? ""]));
    if (!id) data.localId = l;
    const r = await act<{ id: string }>("members.save", { id, data }, id ? "Member updated." : "Member added.");
    setBusy(false);
    if (r) router.push(`/portal/members/${r.id}`);
  }
  const L = (n: string) => lists?.[n] || [];
  const inactive = f.status === "Inactive";
  const needWhere = !id && me?.role !== "local";
  const steps: { key: string; label: string; icon: LucideIcon }[] = [
    ...(needWhere ? [{ key: "where", label: "Belongs to", icon: MapPin }] : []),
    { key: "personal", label: "Personal", icon: UserRound }, { key: "church", label: "Church & PYPA", icon: Church },
    { key: "edu", label: "Qualification", icon: GraduationCap }, { key: "work", label: "Work & home", icon: Home },
    ...(id ? [{ key: "status", label: "Status", icon: ClipboardCheck }] : []), { key: "review", label: "Review", icon: Check },
  ];
  const cur = steps[Math.min(step, steps.length - 1)].key;
  const last = step === steps.length - 1;
  function go(n: number) { setDir(n > step ? 1 : -1); setStep(Math.max(0, Math.min(n, steps.length - 1))); body.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function next() {
    const els = Array.from(body.current?.querySelectorAll<HTMLInputElement>("input,select,textarea") || []);
    const bad = els.find((x) => !x.checkValidity());
    if (bad) { bad.reportValidity(); return; }
    if (cur === "where" && !l) { toast.error("Pick the local PYPA this member belongs to."); return; }
    go(step + 1);
  }
  const localName = tree?.locals.find((x) => x.id === l)?.name;
  const review: [string, string][] = [
    ["Name", f.name], ["Gender", f.gender], ["Date of birth", f.dob ? fmtDate(f.dob) : ""], ["Blood group", f.blood], ...(mobileHidden ? [] : [["Mobile", f.mobile] as [string, string]]), ["Email", f.email],
    ...(needWhere ? [["Local PYPA", localName || ""] as [string, string]] : []), ["Member from", f.from], ["PYPA membership ends", ends ? fmtDate(ends) : ""],
    ["Employment", f.employed], ["Residence", f.residence === "India" ? "India" : f.country], ...(id ? [["Status", f.status + (f.reason ? ` · ${f.reason}` : "")] as [string, string]] : []),
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (last) save(); else next(); }} className="grid gap-5" noValidate={false}>
      {id && <Banner tone="info">Member ID <b className="font-mono">{id}</b> is generated from the master format and cannot be changed.</Banner>}
      {/* stepper */}
      <ol className="card flex items-center gap-1 overflow-x-auto p-3 sm:p-4" aria-label="Progress">
        {steps.map((s, n) => {
          const done = n < step, on = n === step, can = id ? true : n <= step;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-1 last:flex-none">
              <button type="button" disabled={!can} onClick={() => go(n)} className={cn("flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition", on ? "bg-brand-soft" : can ? "hover:bg-sunk" : "opacity-60")} aria-current={on ? "step" : undefined}>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition", done ? "bg-brand text-white dark:text-[#04201a]" : on ? "bg-brand text-white ring-4 ring-brand/20 dark:text-[#04201a]" : "bg-sunk text-mute")}>{done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}</span>
                <span className={cn("hidden whitespace-nowrap text-sm font-semibold md:block", on ? "text-brand" : "text-mute")}>{s.label}</span>
              </button>
              {n < steps.length - 1 && <span className="relative mx-1 hidden h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-line sm:block"><motion.span className="absolute inset-0 origin-left bg-brand" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.4 }} /></span>}
            </li>
          );
        })}
      </ol>
      <p className="-mb-2 text-sm font-semibold text-mute sm:hidden">Step {step + 1} of {steps.length}: <span className="text-ink">{steps[step].label}</span></p>

      <div ref={body} className="scroll-mt-24">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={cur} initial={{ opacity: 0, x: dir * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -28 }} transition={{ duration: 0.2 }}>
            {cur === "where" && (
              <Card title="Which local PYPA does the member belong to?"><div className="grid gap-4 sm:grid-cols-3">
                {me?.role === "state" && <Field label="Zone"><Select blank="All zones" value={z} options={(tree?.zones || []).map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setZ(e.target.value); setC(""); setL(""); }} /></Field>}
                {(me?.role === "state" || me?.role === "zone") && <Field label="Centre"><Select blank="All centres" value={c} options={centres.map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setC(e.target.value); setL(""); }} /></Field>}
                <Field label="Local PYPA" required><Select blank="Select local PYPA" value={l} options={locals.map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => setL(e.target.value)} /></Field>
              </div></Card>
            )}
            {cur === "personal" && (
              <Card title="Personal details">{!id && me?.role === "local" && <p className="mb-4 text-sm text-mute">This member will be added to <b className="text-ink">{me.label}</b>.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Full name" required><Input required value={f.name || ""} onChange={set("name")} autoFocus /></Field>
                <Field label="Gender" required><Select required blank="Select" options={["Male", "Female"]} value={f.gender} onChange={set("gender")} /></Field>
                <Field label="Date of birth" required><Input required type="date" max={new Date().toISOString().slice(0, 10)} value={f.dob || ""} onChange={set("dob")} /></Field>
                <Field label="Blood group"><Select blank="Select" options={L("Blood Group")} value={f.blood || ""} onChange={set("blood")} /></Field>
                <Field label="Govt. ID (masked)" hint="Last digits only, e.g. XXXX-XXXX-1234"><Input value={f.govId || ""} onChange={set("govId")} /></Field>
                <Field label="Marital status"><Select options={MARITAL} value={f.marital} onChange={set("marital")} /></Field>
                <Field label="Family name"><Input value={f.family || ""} onChange={set("family")} /></Field>
                <Field label="Father’s name"><Input value={f.father || ""} onChange={set("father")} /></Field>
                <Field label="Mother’s name"><Input value={f.mother || ""} onChange={set("mother")} /></Field>
                <Field label="Permanent address" className="sm:col-span-2"><Input value={f.perm || ""} onChange={set("perm")} /></Field>
                <Field label="Communication address"><Input value={f.comm || ""} onChange={set("comm")} /></Field>
                {!mobileHidden && <Field label="Mobile" required><Input required inputMode="tel" pattern="[0-9+ ]{8,15}" value={f.mobile || ""} onChange={set("mobile")} /></Field>}
                <Field label="Email"><Input type="email" value={f.email || ""} onChange={set("email")} /></Field>
              </div></Card>
            )}
            {cur === "church" && (
              <Card title="Church & PYPA"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Saved on"><Input type="date" value={f.saved || ""} onChange={set("saved")} /></Field>
                <Field label="Baptised on"><Input type="date" value={f.baptism || ""} onChange={set("baptism")} /></Field>
                <Field label="PYPA member from (year)"><Input inputMode="numeric" pattern="[0-9]{4}" value={f.from || ""} onChange={set("from")} /></Field>
                <Field label="PYPA membership ends on" hint="Date of birth + 40 years, calculated automatically."><Input readOnly value={ends ? fmtDate(ends) : "Fill in the date of birth first"} /></Field>
              </div></Card>
            )}
            {cur === "edu" && (
              <Card title="Qualification"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {([["tenth", "10th / SSLC"], ["twelfth", "12th / Plus Two"], ["diploma", "Diploma"], ["ug", "Under-graduate"], ["pg", "Post-graduate"], ["pgd", "PG Diploma"], ["phd", "PhD"]] as const).map(([k, n]) => <Field key={k} label={n}><Input value={f[k] || ""} onChange={set(k)} placeholder="Course / board" /></Field>)}
              </div></Card>
            )}
            {cur === "work" && (
              <Card title="Employment & residence"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Employment"><Select options={["Employed", "Unemployed", "Student"]} value={f.employed} onChange={set("employed")} /></Field>
                {f.employed === "Employed" && <><Field label="Occupation"><Input value={f.occType || ""} onChange={set("occType")} /></Field><Field label="Organisation"><Input value={f.occOrg || ""} onChange={set("occOrg")} /></Field></>}
                <Field label="Residence"><Select options={["India", "Other Countries"]} value={f.residence} onChange={set("residence")} /></Field>
                {f.residence !== "India" && <Field label="Country"><Select options={L("Country").filter((x) => x !== "India")} value={f.country} onChange={set("country")} /></Field>}
              </div></Card>
            )}
            {cur === "status" && (
              <Card title="Status"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Status"><Select options={["Active", "Inactive"]} value={f.status} onChange={set("status")} /></Field>
                {inactive && <Field label="Reason for inactive" required><Select required blank="Select reason" options={INACTIVE_REASONS} value={f.reason || ""} onChange={set("reason")} /></Field>}
              </div></Card>
            )}
            {cur === "review" && (
              <Card title="Check the details"><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{review.map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase tracking-wider text-mute">{k}</dt><dd className="mt-1 text-[15px]">{v || <span className="text-mute">—</span>}</dd></div>)}</dl>
                <p className="mt-5 text-sm text-mute">{id ? "Saving updates the member and notifies the parent bodies." : "A member ID is generated when you save."}</p></Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 shadow-pop backdrop-blur-xl">
        <button type="button" className="btn" onClick={() => (step === 0 ? router.back() : go(step - 1))}><ArrowLeft className="h-4 w-4" />{step === 0 ? "Cancel" : "Back"}</button>
        <span className="hidden text-sm text-mute sm:block">Step {step + 1} of {steps.length}</span>
        <div className="ml-auto flex gap-2">
          {id && !last && <button type="button" className="btn" disabled={busy} onClick={save}><Save className="h-4 w-4" />Save now</button>}
          {last ? <button className="btn btn-pri min-w-36" disabled={busy}><Save className="h-4 w-4" />{busy ? "Saving…" : id ? "Save changes" : "Add member"}</button>
            : <button className="btn btn-pri min-w-28">Next<ArrowRight className="h-4 w-4" /></button>}
        </div>
      </div>
    </form>
  );
}
