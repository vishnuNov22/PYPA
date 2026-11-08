"use client";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Rows3, Rows4, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "./cn";
import { downloadCSV, downloadXLSX, type ExportCol } from "@/lib/export";

export interface Col<T> {
  key: string; label: string; sortable?: boolean; get?: (r: T) => string | number;
  render?: (r: T) => React.ReactNode; className?: string; hide?: "sm" | "md";
}
export interface TFilter<T> {
  key: string; label: string; type?: "select" | "combo" | "date"; options?: (string | { value: string; label: string })[];
  test: (r: T, v: string) => boolean;
}
interface Props<T> {
  rows: T[] | undefined; cols: Col<T>[]; rowKey: (r: T) => string; filters?: TFilter<T>[];
  searchOf?: (r: T) => string; searchPlaceholder?: string; defaultSort?: [string, 1 | -1]; pageSize?: number;
  rowClass?: (r: T) => string | undefined; actions?: (r: T) => React.ReactNode; toolbar?: React.ReactNode;
  exportName?: string; exportCols?: ExportCol<T>[]; empty?: string; showReset?: boolean; compact?: boolean; onRowClick?: (r: T) => void;
}

export function DataTable<T>({ rows, cols, rowKey, filters = [], searchOf, searchPlaceholder = "Search", defaultSort, pageSize = 50, rowClass, actions, toolbar, exportName, exportCols, empty = "Nothing matches these filters.", showReset = true, onRowClick }: Props<T>) {
  const [dense, setDense] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<[string, 1 | -1] | null>(defaultSort || null);
  const [page, setPage] = useState(1);
  const uid = useId();
  const [menu, setMenu] = useState(false);
  const [showF, setShowF] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const c = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); }; document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = rows;
    if (q && searchOf) { const s = q.toLowerCase(); r = r.filter((x) => searchOf(x).toLowerCase().includes(s)); }
    for (const fl of filters) { const v = f[fl.key]; if (v) r = r.filter((x) => fl.test(x, v)); }
    if (sort) {
      const c = cols.find((x) => x.key === sort[0]);
      if (c?.get) r = [...r].sort((a, b) => { const x = c.get!(a), y = c.get!(b); return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * sort[1]; });
    }
    return r;
  }, [rows, q, f, sort, cols, filters, searchOf]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);
  const dirty = !!q || Object.values(f).some(Boolean);
  const setFilter = (k: string, v: string) => { setF((o) => ({ ...o, [k]: v })); setPage(1); };
  const reset = () => { setQ(""); setF({}); setPage(1); };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
        {searchOf && (
          <label className="field min-w-[200px] flex-1"><span className="lbl">Search</span>
            <span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              <input className="input pl-9" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></span>
          </label>
        )}
        {filters.map((fl) => (
          <label key={fl.key} className={cn("field w-full min-w-[140px] sm:flex sm:w-auto sm:flex-1 sm:max-w-[220px]", !showF && "hidden")}><span className="lbl">{fl.label}</span>
            {fl.type === "date" ? <input type="date" className="input" value={f[fl.key] || ""} onChange={(e) => setFilter(fl.key, e.target.value)} />
              : fl.type === "combo" ? (<>
                <input className="input" list={`${uid}-${fl.key}`} placeholder="All" value={f[fl.key] || ""} onChange={(e) => setFilter(fl.key, e.target.value)} />
                <datalist id={`${uid}-${fl.key}`}>{(fl.options || []).map((o) => { const v = typeof o === "string" ? o : o.label; return <option key={v} value={v} />; })}</datalist></>)
              : <select className="input" value={f[fl.key] || ""} onChange={(e) => setFilter(fl.key, e.target.value)}><option value="">All</option>
                {(fl.options || []).map((o) => { const v = typeof o === "string" ? { value: o, label: o } : o; return <option key={v.value} value={v.value}>{v.label}</option>; })}</select>}
          </label>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {filters.length > 0 && <button className="btn sm:hidden" onClick={() => setShowF(!showF)} aria-expanded={showF}><SlidersHorizontal className="h-4 w-4" />Filters{dirty && Object.values(f).some(Boolean) ? " •" : ""}</button>}
          {showReset && (searchOf || filters.length > 0) && <button className="btn" onClick={reset} disabled={!dirty}><RotateCcw className="h-4 w-4" />Reset</button>}
          {exportName && exportCols && (
            <div className="relative" ref={menuRef}>
              <button className="btn" onClick={() => setMenu(!menu)} disabled={!filtered.length}><Download className="h-4 w-4" />Export</button>
              {menu && (
                <div className="absolute right-0 z-30 mt-1.5 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sunk" onClick={() => { downloadXLSX(exportName, filtered, exportCols); setMenu(false); }}><FileSpreadsheet className="h-4 w-4 text-leaf" />Excel (.xlsx)</button>
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sunk" onClick={() => { downloadCSV(exportName, filtered, exportCols); setMenu(false); }}><Download className="h-4 w-4 text-info" />CSV (.csv)</button>
                  <p className="px-3 pb-1 pt-1.5 text-[11px] text-mute">{filtered.length} rows, with current filters</p>
                </div>
              )}
            </div>
          )}
          <button className="btn hidden !px-3 md:inline-flex" onClick={() => setDense(!dense)} aria-label={dense ? "Comfortable rows" : "Compact rows"} title={dense ? "Comfortable rows" : "Compact rows"}>{dense ? <Rows3 className="h-4 w-4" /> : <Rows4 className="h-4 w-4" />}</button>
          {toolbar}
        </div>
      </div>

      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-sunk/70 text-left text-xs uppercase tracking-wider text-mute">
              {cols.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-3 font-bold", c.hide === "sm" && "hidden sm:table-cell", c.hide === "md" && "hidden md:table-cell", c.className)}>
                  {c.sortable ? (
                    <button className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink" onClick={() => { setSort(sort?.[0] === c.key ? [c.key, (sort[1] * -1) as 1 | -1] : [c.key, 1]); }}>
                      {c.label}{sort?.[0] === c.key && (sort[1] > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : c.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {!rows && Array.from({ length: 6 }).map((_, i) => <tr key={i} className="border-t border-line">{cols.concat(actions ? [{ key: "a", label: "" }] : []).map((c) => <td key={c.key} className="px-4 py-3.5"><div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-sunk" /></td>)}</tr>)}
            {rows && slice.map((r, ri) => (
              <tr key={rowKey(r)} style={{ animationDelay: `${Math.min(ri, 14) * 22}ms` }}
                onClick={onRowClick ? (e) => { if (!(e.target as HTMLElement).closest("a,button,input,select,textarea,label")) onRowClick(r); } : undefined}
                className={cn("animate-fade-up border-t border-line transition hover:bg-brand-soft/50", onRowClick && "cursor-pointer", rowClass?.(r))}>
                {cols.map((c) => <td key={c.key} className={cn(dense ? "px-4 py-1.5" : "px-4 py-3", "align-middle", c.hide === "sm" && "hidden sm:table-cell", c.hide === "md" && "hidden md:table-cell", c.className)}>{c.render ? c.render(r) : c.get ? c.get(r) : null}</td>)}
                {actions && <td className={cn(dense ? "px-4 py-1.5" : "px-4 py-3", "text-right")}><div className="flex flex-wrap justify-end gap-1.5">{actions(r)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {rows && filtered.length === 0 && <div className="px-6 py-14 text-center text-sm text-mute">{empty}</div>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-mute">
        <span>{filtered.length ? `Showing ${(cur - 1) * pageSize + 1}–${(cur - 1) * pageSize + slice.length} of ${filtered.length}` : "0 results"}{filtered.length > pageSize && ` · ${pageSize} per page`}</span>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button className="btn btn-sm !px-2" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - cur) <= 1).map((p, i, a) => (
              <span key={p} className="flex items-center gap-1">{i > 0 && p - a[i - 1] > 1 && <span>…</span>}
                <button className={cn("btn btn-sm min-w-8 !px-2", p === cur && "btn-pri")} onClick={() => setPage(p)}>{p}</button></span>
            ))}
            <button className="btn btn-sm !px-2" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
