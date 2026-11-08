"use client";
import { AlertTriangle, CheckCircle2, Info, Lock, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useId } from "react";
import { Count } from "./Count";
import Link from "next/link";
import { cn } from "./cn";
import { initials, avColor } from "@/lib/format";

export function PageHeader({ title, sub, actions, crumbs }: { title: string; sub?: string; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs && <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-mute" aria-label="Breadcrumb">{crumbs.map((c, i) => <span key={i} className="flex items-center gap-1.5">{i > 0 && <span>/</span>}{c.href ? <Link href={c.href} className="hover:text-brand hover:underline">{c.label}</Link> : <span>{c.label}</span>}</span>)}</nav>}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-mute">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
export function Card({ title, actions, children, className, pad = true }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("card", className)}>
      {(title || actions) && <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">{title && <h2 className="font-display text-xl font-semibold">{title}</h2>}{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</header>}
      <div className={cn(pad && "p-5", title && pad && "pt-4")}>{children}</div>
    </section>
  );
}
export function Stat({ label, value, accent, hint, icon: Icon, delay = 0 }: { label: string; value: React.ReactNode; accent?: boolean; hint?: string; icon?: LucideIcon; delay?: number }) {
  return (
    <motion.div className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-pop" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}>
      {Icon && <span className={cn("absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl transition group-hover:scale-110", accent ? "bg-brand text-white dark:text-[#04201a]" : "bg-brand-soft text-brand")}><Icon className="h-5 w-5" /></span>}
      <div className={cn("font-display text-4xl font-semibold leading-none tabular-nums", accent && "text-brand")}>{typeof value === "number" ? <Count to={value} /> : value}</div>
      <div className="mt-2 text-sm text-mute">{label}</div>{hint && <div className="mt-1 text-xs text-mute">{hint}</div>}
    </motion.div>
  );
}
export function Pill({ tone = "", children }: { tone?: "ok" | "bad" | "warn" | "info" | ""; children: React.ReactNode }) {
  return <span className={cn("pill", tone && `pill-${tone}`)}>{children}</span>;
}
export const statusTone = (s: string) => (["Active", "Approved", "Current", "Online"].includes(s) ? "ok" : ["Inactive", "Rejected", "Ended"].includes(s) ? "bad" : ["Pending", "Pending Approval", "Scheduled"].includes(s) ? "warn" : "") as "ok" | "bad" | "warn" | "";
export const StatusPill = ({ s }: { s: string }) => <Pill tone={statusTone(s)}>{s}</Pill>;

export function Banner({ tone = "info", children, icon }: { tone?: "info" | "ok" | "warn" | "bad"; children: React.ReactNode; icon?: React.ReactNode }) {
  const I = tone === "ok" ? CheckCircle2 : tone === "warn" ? Lock : tone === "bad" ? AlertTriangle : Info;
  return <div className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm", tone === "info" && "bg-info-soft text-info", tone === "ok" && "bg-leaf-soft text-leaf", tone === "warn" && "bg-warn-soft text-warn", tone === "bad" && "bg-bad-soft text-bad")}>{icon || <I className="mt-0.5 h-4 w-4 shrink-0" />}<div className="min-w-0">{children}</div></div>;
}
export function Empty({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-mute">{icon}{children}</div>;
}
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: avColor(name), fontSize: size * 0.38 }}>{initials(name)}</span>;
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  const uid = useId();
  return (
    <div className="scroll-thin mb-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn("relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition", value === t.id ? "text-ink" : "text-mute hover:text-ink")}>
          {t.label}{t.count !== undefined && <span className="ml-2 rounded-full bg-sunk px-2 py-0.5 text-xs">{t.count}</span>}
          {value === t.id && <motion.span layoutId={`tab-${uid}`} className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-brand" transition={{ type: "spring", damping: 30, stiffness: 400 }} />}
        </button>
      ))}
    </div>
  );
}
export function KV({ items, narrow }: { items: [string, React.ReactNode][]; narrow?: boolean }) {
  return <dl className={cn("grid gap-x-6 gap-y-4", narrow ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>{items.map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs font-bold uppercase tracking-wider text-mute">{k}</dt><dd className="mt-1 break-words text-[15px]">{v || "—"}</dd></div>)}</dl>;
}
