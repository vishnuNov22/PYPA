"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity as ActIcon, ArrowRight, Building2, Calculator, CircleDollarSign, FilePlus2, Globe2, Mail, MapPin, Trophy, UserPlus, Users, UserX, type LucideIcon } from "lucide-react";
import { useMe } from "@/components/portal/useMe";
import { Donut, Ring } from "@/components/ui/Charts";
import { Stat } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import { ago } from "@/lib/format";
import type { Activity } from "@/lib/types";

interface Dash {
  title: string; tiles: { label: string; value: number; accent?: boolean }[];
  charts: { id: string; title: string; data: { label: string; value: number }[] }[];
  pending: { label: string; count: number; href: string }[];
  dues: { total: number; paidThisYear: number; year: number };
}
const ICON: Record<string, LucideIcon> = { "Active members": Users, "Inactive members": UserX, Zones: Globe2, Centres: Building2, "Local PYPA units": MapPin };

export default function Dashboard() {
  const me = useMe();
  const { data } = useRpc<Dash>("dash.get");
  const { data: acts } = useRpc<Activity[]>("activity.list");
  const [hello, setHello] = useState("Welcome");
  const [today, setToday] = useState("");
  useEffect(() => { const h = new Date().getHours(); setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"); setToday(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })); }, []);
  const role = me?.role;
  const actions: { href: string; label: string; icon: LucideIcon }[] = [
    ...(role === "state" || role === "local" ? [{ href: "/portal/members/new", label: "Add member", icon: UserPlus }] : []),
    { href: "/portal/members/dues", label: role === "state" ? "Review dues" : "Pay dues", icon: role === "state" ? CircleDollarSign : Calculator },
    { href: "/portal/letters", label: "Write a letter", icon: Mail },
    { href: "/portal/talent", label: "Talent test", icon: Trophy },
  ];
  if (!data) return <div className="grid gap-4"><div className="h-52 animate-pulse rounded-3xl bg-sunk" /><div className="grid grid-cols-2 gap-4 md:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-sunk" />)}</div></div>;
  const pct = data.dues.total ? Math.round((data.dues.paidThisYear / data.dues.total) * 100) : 0;
  return (
    <>
      <motion.section className="relative isolate overflow-hidden rounded-3xl bg-brand-deep p-7 text-white shadow-pop sm:p-9" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid-fade absolute inset-0 -z-10" /><div className="orb -right-10 -top-16 -z-10 h-72 w-72 bg-brand/55" /><div className="orb -bottom-24 left-1/3 -z-10 h-64 w-64 bg-gold/20" style={{ animationDelay: "-5s" }} />
        <Image src="/logo.webp" alt="" width={260} height={260} className="pointer-events-none absolute -bottom-10 -right-6 -z-10 hidden w-[260px] opacity-[.14] sm:block" />
        <p className="text-sm font-semibold text-gold">{today || " "}</p>
        <h1 className="mt-1.5 font-display text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-tight">{hello}, <span className="text-gold">{data.title}</span></h1>
        <p className="mt-2 max-w-xl text-white/75">Here is how your members and dues look today. Press <kbd className="rounded-md border border-white/25 px-1.5 py-0.5 text-xs">Ctrl K</kbd> to jump anywhere.</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {actions.map((a, i) => <motion.div key={a.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}><Link href={a.href} className="glass inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"><a.icon className="h-4 w-4 text-gold" />{a.label}</Link></motion.div>)}
        </div>
      </motion.section>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">{data.tiles.map((t, i) => <Stat key={t.label} {...t} icon={ICON[t.label]} delay={i * 0.06} />)}</div>

      {data.pending.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-xl font-semibold">Needs your attention</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.pending.map((p, i) => (
            <motion.div key={p.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <Link href={p.href} className="group flex items-center gap-4 rounded-2xl border border-brand/25 bg-brand-soft/70 px-5 py-4 transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-card">
                <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-brand font-display text-2xl font-semibold text-white dark:text-[#04201a]"><span className="pulse-dot absolute inset-0 rounded-xl" />{p.count}</span>
                <span className="text-sm font-semibold">{p.label}</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-brand transition group-hover:translate-x-1" /></Link></motion.div>))}</div>
        </section>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {data.charts.map((c, i) => <Donut key={c.id} title={c.title} data={c.data} delay={i * 70} />)}
        <section className="card p-5"><h3 className="font-display text-lg font-semibold">Dues for {data.dues.year}</h3>
          <div className="mt-4 flex flex-wrap items-center gap-6"><Ring pct={pct} label="paid" />
            <div className="min-w-[180px] flex-1"><p className="text-sm text-mute"><b className="font-display text-3xl text-ink tabular-nums">{data.dues.paidThisYear}</b> of {data.dues.total} members have paid this year.</p>
              <Link href="/portal/members/dues" className="btn btn-sm btn-pri mt-4">Open dues calculation <ArrowRight className="h-4 w-4" /></Link></div></div></section>
        <section className="card flex flex-col p-5"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Recent activity</h3><Link href="/portal/activity" className="link text-sm">View all</Link></div>
          <ol className="relative mt-4 grid flex-1 gap-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
            {(acts || []).slice(0, 6).map((a) => (
              <li key={a.id} className="relative flex gap-3 pl-6"><span className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-surface ${a.type === "Add" ? "bg-brand" : "bg-gold"}`} />
                <div className="min-w-0"><p className="text-sm leading-snug">{a.desc}</p><p className="mt-0.5 text-xs text-mute">{a.user} · {ago(a.date)}</p></div></li>))}
            {acts && acts.length === 0 && <li className="pl-6 text-sm text-mute">Nothing yet.</li>}
            {!acts && <li className="pl-6 text-sm text-mute">Loading…</li>}
          </ol></section>
      </div>
    </>
  );
}
void ActIcon; void FilePlus2;
