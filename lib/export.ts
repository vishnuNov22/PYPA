"use client";
import * as XLSX from "xlsx";

export type ExportCol<T> = [label: string, get: (r: T) => string | number | null | undefined];
function table<T>(rows: T[], cols: ExportCol<T>[]) { return [cols.map((c) => c[0]), ...rows.map((r) => cols.map((c) => c[1](r) ?? ""))]; }
function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function downloadCSV<T>(name: string, rows: T[], cols: ExportCol<T>[]) {
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = "﻿" + table(rows, cols).map((r) => r.map(esc).join(",")).join("\n");
  save(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
}
export function downloadXLSX<T>(name: string, rows: T[], cols: ExportCol<T>[]) {
  const ws = XLSX.utils.aoa_to_sheet(table(rows, cols));
  ws["!cols"] = cols.map((c, i) => ({ wch: Math.min(40, Math.max(c[0].length + 2, ...rows.slice(0, 50).map((r) => String(cols[i][1](r) ?? "").length + 2))) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 30));
  XLSX.writeFile(wb, `${name}.xlsx`);
}
