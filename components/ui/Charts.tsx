"use client";
import { motion } from "framer-motion";
import { useId, useState } from "react";

export const PALETTE = ["#237B68", "#142E37", "#7FE0B8", "#2AA3A3", "#9CCC4F", "#4A90C2", "#E0A312", "#7A8794"];
export interface Slice { label: string; value: number }

const R = 62, C = 80;
const pt = (a: number) => [C + R * Math.cos(a), C + R * Math.sin(a)];
function arc(a0: number, a1: number) {
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Interactive donut: hover a slice or a legend row to read its value in the centre. */
export function Donut({ title, data, unit = "members", delay = 0 }: { title: string; data: Slice[]; unit?: string; delay?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId();
  let acc = -Math.PI / 2;
  const segs = data.map((d, i) => {
    const frac = total ? d.value / total : 0, span = Math.min(frac * Math.PI * 2, Math.PI * 2 - 0.001);
    const gap = frac > 0 && frac < 0.999 ? 0.045 : 0, a0 = acc + gap / 2, a1 = acc + span - gap / 2;
    acc += frac * Math.PI * 2;
    return { i, d, frac, a0, a1: Math.max(a1, a0 + 0.001) };
  });
  const h = hover !== null ? data[hover] : null;
  return (
    <motion.section className="card p-5" aria-label={title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay / 1000, duration: 0.5 }}>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-[176px] w-[176px] shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-0" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
            <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(var(--sunk))" strokeWidth={20} />
            {segs.filter((s) => s.frac > 0).map((s) => (
              <motion.path key={`${uid}${s.d.label}`} d={arc(s.a0, s.a1)} fill="none" stroke={PALETTE[s.i % PALETTE.length]} strokeLinecap="round" style={{ cursor: "pointer" }}
                initial={{ pathLength: 0, strokeWidth: 20 }} animate={{ pathLength: 1, strokeWidth: hover === s.i ? 27 : 20, opacity: hover === null || hover === s.i ? 1 : 0.35 }}
                transition={{ pathLength: { duration: 0.9, delay: delay / 1000 + s.i * 0.08, ease: "easeOut" }, strokeWidth: { duration: 0.18 }, opacity: { duration: 0.18 } }}
                onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)} />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="font-display text-3xl font-semibold leading-none tabular-nums">{(h ? h.value : total).toLocaleString("en-IN")}</span>
            <span className="mt-1 line-clamp-2 text-[11px] uppercase leading-tight tracking-wider text-mute">{h ? `${h.label} · ${total ? Math.round((h.value / total) * 100) : 0}%` : unit}</span>
          </div>
        </div>
        <ul className="grid w-full min-w-0 flex-1 gap-1 text-sm">
          {data.map((d, i) => (
            <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={`flex cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${hover === i ? "bg-sunk" : ""}`}>
              <i className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate">{d.label}</span>
              <span className="ml-auto whitespace-nowrap font-semibold tabular-nums">{d.value}<span className="ml-1.5 font-normal text-mute">{total ? `${Math.round((d.value / total) * 100)}%` : ""}</span></span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

/** Circular progress ring with the percentage in the centre. */
export function Ring({ pct, size = 150, label }: { pct: number; size?: number; label?: string }) {
  const r = 58, c = 70, p = Math.max(0, Math.min(100, pct)) / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgb(var(--sunk))" strokeWidth={14} />
        <motion.circle cx={c} cy={c} r={r} fill="none" stroke="rgb(var(--brand))" strokeWidth={14} strokeLinecap="round" strokeDasharray={2 * Math.PI * r} initial={{ strokeDashoffset: 2 * Math.PI * r }} animate={{ strokeDashoffset: 2 * Math.PI * r * (1 - p) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><b className="font-display text-3xl tabular-nums">{Math.round(pct)}%</b>{label && <span className="text-[11px] uppercase tracking-wider text-mute">{label}</span>}</div>
    </div>
  );
}
