"use client";
import { useRef, useState } from "react";
import { Download, Eraser, Inbox, Paperclip, PenLine, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/components/portal/useMe";
import { Field, Input, MultiSelect, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Card, Empty, PageHeader, Tabs } from "@/components/ui/kit";
import { act, upload, useRpc } from "@/lib/client";
import { fmtDT, sizeLabel } from "@/lib/format";
import type { Letter } from "@/lib/types";

type L = Letter & { recipients: string };
interface Aud { groups: { id: string; label: string; options: { value: string; label: string }[] }[]; canAttach: boolean; maxMb: number }

export default function Letters() {
  const me = useMe();
  const { data } = useRpc<{ inbox: L[]; sent: L[] }>("letters.list");
  const { data: aud } = useRpc<Aud>("letters.audience");
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [open, setOpen] = useState<L | null>(null);
  const [compose, setCompose] = useState(false);
  const rows = data?.[tab] || [];
  return (
    <>
      <PageHeader title="Letters" sub="Send circulars to other units and read the ones sent to you."
        actions={<>{me?.role === "state" && <ClearFiles />}<button className="btn btn-pri" onClick={() => setCompose(true)}><PenLine className="h-4 w-4" />New letter</button></>} />
      <Card pad={false}>
        <div className="border-b border-line px-5 pt-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: "inbox", label: "Inbox", count: data?.inbox.length }, { id: "sent", label: "Sent", count: data?.sent.length }]} /></div>
        {!data ? <div className="m-5 h-32 animate-pulse rounded-xl bg-sunk" /> : rows.length === 0 ? <Empty icon={<Inbox className="h-8 w-8" />}>{tab === "inbox" ? "No letters received yet." : "You haven’t sent any letters."}</Empty> : (
          <ul className="divide-y divide-line">
            {rows.map((l) => (
              <li key={l.id}><button className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-sunk/60" onClick={() => setOpen(l)}>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-3"><b className="truncate">{l.subject}</b>{l.attachment && <Paperclip className="h-3.5 w-3.5 text-mute" />}</div>
                  <p className="mt-0.5 truncate text-sm text-mute">{tab === "inbox" ? `From ${l.fromLabel}` : `To ${l.recipients}`} — {l.body}</p></div>
                <span className="shrink-0 text-xs text-mute">{fmtDT(l.date)}</span></button></li>
            ))}
          </ul>
        )}
      </Card>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.subject || ""} size="lg" footer={<button className="btn" onClick={() => setOpen(null)}>Close</button>}>
        {open && <div className="grid gap-4"><p className="text-sm text-mute">From <b className="text-ink">{open.fromLabel}</b> · To {open.recipients} · {fmtDT(open.date)}{open.sms && " · SMS sent"}</p>
          <p className="whitespace-pre-wrap leading-relaxed">{open.body}</p>
          {open.attachment && <a className="btn w-fit" href={open.attachment.url} download={open.attachment.name}><Download className="h-4 w-4" />{open.attachment.name} <span className="text-xs text-mute">({sizeLabel(open.attachment.size)})</span></a>}</div>}
      </Modal>
      <Compose open={compose} onClose={() => setCompose(false)} aud={aud} />
    </>
  );
}

function ClearFiles() {
  const [c, setC] = useState(false);
  return (<>
    <button className="btn" onClick={() => setC(true)}><Eraser className="h-4 w-4" />Clear files</button>
    <Modal open={c} onClose={() => setC(false)} title="Clear old attachments" size="sm" footer={<><button className="btn" onClick={() => setC(false)}>Cancel</button><button className="btn btn-bad" onClick={async () => { await act<{ cleared: number }>("letters.clearOld", {}, (r) => `${r.cleared} attachment${r.cleared === 1 ? "" : "s"} cleared.`); setC(false); }}>Clear files</button></>}>
      <p className="text-sm">This removes the attachments of every letter that is more than <b>one year old</b>. The letters themselves stay.</p>
    </Modal></>);
}

function Compose({ open, onClose, aud }: { open: boolean; onClose: () => void; aud?: Aud }) {
  const [to, setTo] = useState<Record<string, string[] | null>>({});
  const [subject, setSubject] = useState(""), [body, setBody] = useState(""), [sms, setSms] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const groups = aud?.groups || [];
  // default is All for each group; null = All
  const val = (g: string) => (g in to ? to[g] : null);
  function pick(f: File | undefined) {
    if (!f) return;
    if (!/\.(pdf|jpe?g)$/i.test(f.name)) { toast.error("Only PDF or JPG files can be attached."); return; }
    if (f.size > (aud?.maxMb || 2) * 1048576) { toast.error(`File is larger than ${aud?.maxMb} MB.`); return; }
    setFile(f);
  }
  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const recips = groups.flatMap((g) => { const v = val(g.id); return v === null ? g.options.map((o) => o.value) : v; });
      const attachment = file ? await upload("letter", file) : null;
      const r = await act<{ count: number }>("letters.send", { to: recips, subject, body, attachment, sms }, (x) => `Letter sent to ${x.count} unit${x.count === 1 ? "" : "s"}.`);
      if (r) { setSubject(""); setBody(""); setFile(null); setSms(false); setTo({}); onClose(); }
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="New letter" size="lg" footer={<><button className="btn" onClick={onClose}>Cancel</button><button form="letter-form" className="btn btn-pri" disabled={busy}><Send className="h-4 w-4" />{busy ? "Sending…" : "Send letter"}</button></>}>
      <form id="letter-form" onSubmit={send} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">{groups.map((g) => (
          <Field key={g.id} label={`To — ${g.label}`}><MultiSelect options={g.options} value={val(g.id)} onChange={(v) => setTo({ ...to, [g.id]: v })} allLabel={`All ${g.label.toLowerCase()}`} /></Field>))}</div>
        <Field label="Subject" required><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field label="Message" required><Textarea required rows={6} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        {aud?.canAttach && (
          <div className="rounded-xl border border-dashed border-line p-4">
            <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" hidden onChange={(e) => pick(e.target.files?.[0])} />
            {file ? <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><Paperclip className="h-4 w-4" />{file.name} <span className="text-mute">({sizeLabel(file.size)})</span></span><button type="button" className="btn btn-sm btn-ghost" onClick={() => setFile(null)} aria-label="Remove file"><X className="h-4 w-4" /></button></div>
              : <button type="button" className="btn btn-sm" onClick={() => ref.current?.click()}><Paperclip className="h-4 w-4" />Attach PDF or JPG</button>}
            <p className="mt-2 text-xs text-mute">One file, PDF or JPG, up to {aud.maxMb} MB. Attachments are cleared after one year.</p>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[rgb(var(--brand))]" checked={sms} onChange={(e) => setSms(e.target.checked)} />Also send an SMS alert to the recipients’ admins</label>
      </form>
    </Modal>
  );
}
