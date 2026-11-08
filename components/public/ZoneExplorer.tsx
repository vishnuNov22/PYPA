"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, MapPin, Users } from "lucide-react";
import { Count } from "@/components/ui/Count";
import { cn } from "@/components/ui/cn";

export interface ZoneStat { id: string; name: string; centres: number; locals: number; members: number }

export function ZoneExplorer({ zones }: { zones: ZoneStat[] }) {
  const [sel, setSel] = useState(zones[0]?.id);
  const z = zones.find((x) => x.id === sel) || zones[0];
  const max = Math.max(1, ...zones.map((x) => x.members));
  const total = Math.max(1, zones.reduce((a, b) => a + b.members, 0));
  if (!z) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="tablist" aria-label="Zones">
        {zones.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === sel} onClick={() => setSel(x.id)} onMouseEnter={() => setSel(x.id)}
            className={cn("group relative overflow-hidden rounded-2xl border p-4 text-left transition", x.id === sel ? "border-brand bg-brand text-white shadow-pop dark:text-[#04201a]" : "border-line bg-surface hover:-translate-y-0.5 hover:border-brand/50")}>
            <span className="relative z-10 flex items-center gap-1.5 text-sm font-bold"><MapPin className="h-3.5 w-3.5" />{x.name}</span>
            <span className={cn("relative z-10 mt-1 block text-xs tabular-nums", x.id === sel ? "opacity-80" : "text-mute")}>{x.members.toLocaleString("en-IN")} members</span>
            <span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-1 origin-left", x.id === sel ? "bg-white/50" : "bg-brand/30")} style={{ transform: `scaleX(${x.members / max})` }} />
          </button>
        ))}
      </div>
      <div className="relative min-h-[300px] overflow-hidden rounded-3xl bg-brand-deep p-7 text-white shadow-pop">
        <div className="grid-fade absolute inset-0" /><div className="orb -right-10 -top-10 h-48 w-48 bg-brand/40" />
        <AnimatePresence mode="wait">
          <motion.div key={z.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="relative">
            <span className="text-xs font-bold uppercase tracking-[.2em] text-gold">Zone</span>
            <h3 className="mt-2 font-display text-5xl font-semibold">{z.name}</h3>
            <dl className="mt-8 grid grid-cols-3 gap-4">
              {([[Users, z.members, "Active members"], [Building2, z.centres, "Centres"], [MapPin, z.locals, "Local PYPAs"]] as const).map(([I, n, l]) => (
                <div key={l}><I className="h-5 w-5 text-gold" /><dd className="mt-2 font-display text-4xl font-semibold tabular-nums"><Count to={n} duration={0.7} /></dd><dt className="text-xs text-white/70">{l}</dt></div>
              ))}
            </dl>
            <div className="mt-8"><div className="flex justify-between text-xs text-white/70"><span>Share of State membership</span><span>{Math.round((z.members / total) * 100)}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><motion.div className="h-full rounded-full bg-gold" initial={false} animate={{ width: `${(z.members / total) * 100}%` }} transition={{ duration: 0.6 }} /></div></div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
