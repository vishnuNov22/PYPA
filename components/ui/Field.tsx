"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "./cn";

export function Field({ label, hint, required, children, className, readonlyNote }: { label?: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string; readonlyNote?: boolean }) {
  return (
    <label className={cn("field", className)}>
      {label && <span className="lbl">{label}{required && <b className="ml-1 text-bad">*</b>}{readonlyNote && <i className="ml-2 text-xs font-normal text-mute">(not editable)</i>}</span>}
      {children}
      {hint && <small className="text-xs text-mute">{hint}</small>}
    </label>
  );
}
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) { return <input ref={ref} className={cn("input", className)} {...p} />; });
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) { return <textarea ref={ref} rows={4} className={cn("input", className)} {...p} />; });
export function Select({ options, blank, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[]; blank?: string }) {
  return (
    <select className={cn("input pr-8", className)} {...p}>
      {blank !== undefined && <option value="">{blank}</option>}
      {options.map((o) => { const v = typeof o === "string" ? { value: o, label: o } : o; return <option key={v.value} value={v.value}>{v.label}</option>; })}
    </select>
  );
}

export interface Opt { value: string; label: string; sub?: string }
/** Searchable single select. */
export function Combobox({ options, value, onChange, placeholder = "Search…", disabled, allowClear }: { options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; allowClear?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const sel = options.find((o) => o.value === value);
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return (s ? options.filter((o) => (o.label + " " + (o.sub || "")).toLowerCase().includes(s)) : options).slice(0, 80); }, [options, q]);
  useEffect(() => { const c = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, []);
  const pick = (o: Opt) => { onChange(o.value); setOpen(false); setQ(""); };
  return (
    <div ref={root} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
        <input className="input pl-9 pr-8" disabled={disabled} placeholder={sel ? sel.label : placeholder} value={open ? q : sel ? sel.label : ""} role="combobox" aria-expanded={open} autoComplete="off"
          onFocus={() => { setOpen(true); setQ(""); }} onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter" && open && list[hi]) { e.preventDefault(); pick(list[hi]); }
            else if (e.key === "Escape") setOpen(false);
          }} />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
      </div>
      {open && (
        <ul className="scroll-thin absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-pop">
          {allowClear && value && <li><button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-mute hover:bg-sunk" onClick={() => { onChange(""); setOpen(false); }}>Clear selection</button></li>}
          {list.length === 0 && <li className="px-3 py-3 text-sm text-mute">No match</li>}
          {list.map((o, i) => (
            <li key={o.value}>
              <button type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(o)} className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm", i === hi && "bg-sunk", o.value === value && "font-semibold")}>
                <span className="truncate">{o.label}{o.sub && <span className="ml-2 text-xs text-mute">{o.sub}</span>}</span>
                {o.value === value && <Check className="h-4 w-4 text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Multi select. `value === null` means All (the default). */
export function MultiSelect({ options, value, onChange, allLabel = "All", noAll, placeholder = "Select…" }: { options: Opt[]; value: string[] | null; onChange: (v: string[] | null) => void; allLabel?: string; noAll?: boolean; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => { const c = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, []);
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const label = value === null ? allLabel : value.length === 0 ? placeholder : value.length === 1 ? options.find((o) => o.value === value[0])?.label ?? "1 selected" : `${value.length} selected`;
  const toggle = (v: string) => { const cur = value ?? []; const n = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]; onChange(n.length === 0 && !noAll ? null : n); };
  return (
    <div ref={root} className="relative">
      <button type="button" aria-controls={id} aria-expanded={open} onClick={() => setOpen(!open)} className="input flex items-center justify-between gap-2 text-left">
        <span className={cn("truncate", value && value.length === 0 && "text-mute")}>{label}</span><ChevronDown className="h-4 w-4 shrink-0 text-mute" />
      </button>
      {open && (
        <div id={id} className="absolute z-50 mt-1.5 w-full min-w-[220px] rounded-xl border border-line bg-surface p-2 shadow-pop">
          {options.length > 8 && <input className="input mb-2 min-h-9" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />}
          <div className="scroll-thin max-h-60 overflow-auto">
            {!noAll && <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-sunk"><input type="checkbox" className="accent-[rgb(var(--brand))]" checked={value === null} onChange={() => onChange(value === null ? [] : null)} />{allLabel}</label>}
            {shown.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sunk">
                <input type="checkbox" className="accent-[rgb(var(--brand))]" checked={value !== null && value.includes(o.value)} onChange={() => toggle(o.value)} />{o.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
