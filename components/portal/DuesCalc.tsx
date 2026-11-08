"use client";
import { useEffect, useState } from "react";
import { QrCode, Landmark, ArrowLeft, Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Count } from "@/components/ui/Count";
import { cn } from "@/components/ui/cn";
import QRCode from "qrcode";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Banner } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { inr } from "@/lib/format";
import { useMe } from "./useMe";

interface Calc { fee: number; total: number; due: number; rows: { year: number; members: number; amount: number }[]; amount: number }
interface Tree { zones: { id: string; name: string }[]; centres: { id: string; name: string; zoneId: string }[]; locals: { id: string; name: string; zoneId: string; centreId: string }[] }
const UPI = process.env.NEXT_PUBLIC_UPI_ID || "pypakerala@upi";

function QR({ text }: { text: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(text, { width: 240, margin: 1, color: { dark: "#142e37", light: "#ffffff" } }).then(setSrc).catch(() => setSrc("")); }, [text]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="UPI payment QR code" width={200} height={200} className="rounded-xl border border-line bg-white p-2" /> : <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-sunk" />;
}

export function DuesCalc({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe();
  const { data: tree } = useRpc<Tree>(open ? "org.tree" : null);
  const [z, setZ] = useState(""), [c, setC] = useState(""), [l, setL] = useState("");
  const [step, setStep] = useState<"calc" | "pay" | "done">("calc");
  const [mode, setMode] = useState<"Online" | "Offline">("Online");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const input = { zone: z, centre: c, local: l };
  const { data: calc } = useRpc<Calc>(open ? "dues.calc" : null, input);
  useEffect(() => { if (open) { setStep("calc"); setRef(""); } }, [open]);
  const role = me?.role;
  const centres = (tree?.centres || []).filter((x) => !z || x.zoneId === z);
  const locals = (tree?.locals || []).filter((x) => (!c || x.centreId === c) && (!z || x.zoneId === z));
  const upi = `upi://pay?pa=${UPI}&pn=PYPA%20Kerala%20State&am=${calc?.amount || 0}&cu=INR&tn=PYPA%20membership%20dues`;
  const [paid, setPaid] = useState(0);
  async function confirm() {
    setBusy(true);
    const amt = calc?.amount || 0;
    const r = await act("dues.pay", { ...input, mode, ref }, "Payment submitted. State will verify and approve it.");
    setBusy(false);
    if (r) { setPaid(amt); setStep("done"); }
  }
  const stepNo = step === "calc" ? 0 : step === "pay" ? 1 : 2;
  const Steps = (
    <ol className="mb-5 flex items-center gap-2">
      {["Calculate", "Pay", "Done"].map((n, i) => (
        <li key={n} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition", i < stepNo ? "bg-brand text-white dark:text-[#04201a]" : i === stepNo ? "bg-brand text-white ring-4 ring-brand/20 dark:text-[#04201a]" : "bg-sunk text-mute")}>{i < stepNo ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
          <span className={cn("text-sm font-semibold", i === stepNo ? "text-brand" : "text-mute")}>{n}</span>
          {i < 2 && <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line"><motion.span className="absolute inset-0 origin-left bg-brand" initial={false} animate={{ scaleX: i < stepNo ? 1 : 0 }} transition={{ duration: 0.4 }} /></span>}
        </li>
      ))}
    </ol>
  );
  return (
    <Modal open={open} onClose={onClose} title={step === "calc" ? "Dues calculation" : step === "pay" ? "Pay membership dues" : "Payment submitted"} size="lg"
      footer={step === "done" ? <button className="btn btn-pri" onClick={onClose}>Done</button> : step === "calc"
        ? <><button className="btn" onClick={onClose}>Close</button>{role !== "state" && <button className="btn btn-gold" disabled={!calc?.due} onClick={() => setStep("pay")}>Pay {calc?.amount ? inr(calc.amount) : ""}</button>}</>
        : <><button className="btn" onClick={() => setStep("calc")}><ArrowLeft className="h-4 w-4" />Back</button><button className="btn btn-pri" disabled={busy || !ref.trim()} onClick={confirm}>{busy ? "Submitting…" : "Confirm payment"}</button></>}>
      {Steps}
      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
      {step === "done" ? (
        <div className="grid justify-items-center gap-4 py-6 text-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="relative grid h-20 w-20 place-items-center rounded-full bg-brand text-white dark:text-[#04201a]">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
            <svg viewBox="0 0 24 24" className="relative h-10 w-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45 }} /></svg>
          </motion.span>
          <div><p className="font-display text-4xl tabular-nums text-brand">₹<Count to={paid} /></p><p className="mt-1 text-sm text-mute">submitted via {mode.toLowerCase()} payment</p></div>
          <div className="w-full max-w-sm rounded-2xl bg-sunk p-4 text-left text-sm">
            <div className="flex justify-between gap-3"><span className="text-mute">Reference</span><b className="break-all font-mono">{ref}</b></div>
            <div className="mt-2 flex justify-between gap-3"><span className="text-mute">Status</span><b className="text-warn">Awaiting State approval</b></div>
            <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline" onClick={() => navigator.clipboard?.writeText(ref).catch(() => {})}><Copy className="h-3.5 w-3.5" />Copy reference</button>
          </div>
          <p className="max-w-sm text-sm text-mute">State will verify the payment and mark the dues as paid. You will see it in the payment history.</p>
        </div>
      ) : step === "calc" ? (
        <div className="grid gap-5">
          {role !== "local" && (
            <div className="grid gap-4 sm:grid-cols-3">
              {role === "state" && <Field label="Zone"><Select blank="All zones" value={z} options={(tree?.zones || []).map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setZ(e.target.value); setC(""); setL(""); }} /></Field>}
              {(role === "state" || role === "zone") && <Field label="Centre"><Select blank="All centres" value={c} options={centres.map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => { setC(e.target.value); setL(""); }} /></Field>}
              <Field label="Local PYPA"><Select blank="All locals" value={l} options={locals.map((x) => ({ value: x.id, label: x.name }))} onChange={(e) => setL(e.target.value)} /></Field>
            </div>
          )}
          {role === "state" && <Banner tone="info">State reviews and approves payments submitted by other units, so there is no Pay button here.</Banner>}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-sunk p-4"><b className="font-display text-3xl tabular-nums">{calc?.total ?? "…"}</b><p className="text-xs text-mute">Active members</p></div>
            <div className="rounded-2xl bg-sunk p-4"><b className="font-display text-3xl tabular-nums">{calc?.due ?? "…"}</b><p className="text-xs text-mute">With dues</p></div>
            <div className="rounded-2xl bg-sunk p-4"><b className="font-display text-3xl tabular-nums">{calc ? inr(calc.fee) : "…"}</b><p className="text-xs text-mute">Fee per year</p></div>
          </div>
          <div className="scroll-thin overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm"><thead><tr className="bg-sunk/70 text-left text-xs uppercase tracking-wider text-mute"><th className="px-4 py-2.5">Year</th><th className="px-4 py-2.5">Members pending</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
              <tbody>{(calc?.rows || []).map((r) => <tr key={r.year} className="border-t border-line"><td className="px-4 py-2.5 font-semibold">{r.year}</td><td className="px-4 py-2.5 tabular-nums">{r.members}</td><td className="px-4 py-2.5 text-right tabular-nums">{inr(r.amount)}</td></tr>)}
                {calc && calc.rows.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-leaf">Everything is paid up for this selection.</td></tr>}</tbody>
              {calc && calc.rows.length > 0 && <tfoot><tr className="border-t-2 border-line bg-sunk/50 font-bold"><td className="px-4 py-3" colSpan={2}>Total payable</td><td className="px-4 py-3 text-right tabular-nums">{inr(calc.amount)}</td></tr></tfoot>}
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="rounded-2xl bg-brand p-5 text-white dark:text-[#04201a]"><p className="text-xs font-semibold uppercase tracking-wider opacity-80">Amount to pay</p><b className="font-display text-4xl tabular-nums">{inr(calc?.amount || 0)}</b></div>
          <div className="grid grid-cols-2 gap-3">
            {([["Online", QrCode, "Scan QR with any UPI app"], ["Offline", Landmark, "Cash / bank transfer to State"]] as const).map(([m, I, t]) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-2xl border-2 p-4 text-left transition ${mode === m ? "border-brand bg-brand/5" : "border-line hover:border-mute"}`}><I className="h-5 w-5 text-brand" /><b className="mt-2 block">{m} payment</b><span className="text-xs text-mute">{t}</span></button>
            ))}
          </div>
          {mode === "Online" ? (
            <div className="flex flex-wrap items-center gap-6"><QR text={upi} /><div className="min-w-[200px] flex-1 text-sm"><p>Pay <b>{inr(calc?.amount || 0)}</b> to <span className="font-mono">{UPI}</span>, then enter the UPI transaction ID below.</p><p className="mt-2 text-xs text-mute">Sample payee ID: set <code className="font-mono">NEXT_PUBLIC_UPI_ID</code> to the State account.</p></div></div>
          ) : (
            <Banner tone="info">Hand over the amount to the State office or deposit it in the State account and enter the receipt or deposit reference below. State will verify it.</Banner>
          )}
          <Field label={mode === "Online" ? "UPI transaction ID" : "Receipt / deposit reference"} required><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder={mode === "Online" ? "e.g. 4021 5588 9012" : "e.g. Receipt #118"} /></Field>
        </div>
      )}
      </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
