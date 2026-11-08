"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, FilePlus2, KeyRound, LogOut, MapPin, Moon, Search, User, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { useRpc } from "@/lib/client";
import type { Role } from "@/lib/types";
import { menuFor } from "./menu";

interface Cmd { id: string; group: string; label: string; hint?: string; icon: LucideIcon; run: () => void }
interface Mem { id: string; name: string; local: string }
interface Tree { zones: { id: string; name: string }[]; centres: { id: string; name: string }[]; locals: { id: string; name: string; status: string }[] }

export function CommandPalette({ open, onClose, role, unitId, onSignOut, onPassword }: { open: boolean; onClose: () => void; role: Role; unitId: string | null; onSignOut: () => void; onPassword: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState(""), [i, setI] = useState(0);
  const inp = useRef<HTMLInputElement>(null), list = useRef<HTMLUListElement>(null);
  const { data: members } = useRpc<Mem[]>(open && role !== "admin" ? "members.list" : null);
  const { data: tree } = useRpc<Tree>(open && role !== "admin" ? "org.tree" : null);
  useEffect(() => { if (open) { setQ(""); setI(0); setTimeout(() => inp.current?.focus(), 40); } }, [open]);

  const cmds = useMemo(() => {
    const go = (href: string) => () => router.push(href);
    const out: Cmd[] = [];
    for (const it of menuFor(role, unitId)) {
      if (it.group || !it.icon) continue;
      out.push({ id: it.href + it.label, group: "Go to", label: it.label, icon: it.icon, run: go(it.href) });
      for (const s of it.sub || []) if (s.href !== it.href) out.push({ id: s.href, group: "Go to", label: s.label, icon: it.icon, run: go(s.href) });
    }
    if (role === "state" || role === "local") out.push({ id: "a-member", group: "Actions", label: "Add a member", icon: FilePlus2, run: go("/portal/members/new") });
    if (role !== "admin") out.push({ id: "a-letter", group: "Actions", label: "Write a letter", icon: FilePlus2, run: go("/portal/letters") });
    out.push({ id: "a-theme", group: "Actions", label: "Switch light / dark mode", icon: Moon, run: () => { const r = document.documentElement; const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); const n = cur === "dark" ? "light" : "dark"; r.dataset.theme = n; try { localStorage.setItem("pypa-theme", n); } catch {} } },
      { id: "a-pw", group: "Actions", label: "Change password", icon: KeyRound, run: onPassword }, { id: "a-out", group: "Actions", label: "Sign out", icon: LogOut, run: onSignOut });
    return out;
  }, [role, unitId, router, onSignOut, onPassword]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = cmds.filter((c) => !s || c.label.toLowerCase().includes(s) || (s.length > 2 && c.group.toLowerCase().includes(s)));
    const extra: Cmd[] = [];
    if (s.length >= 2) {
      (members || []).filter((m) => m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s)).slice(0, 7).forEach((m) => extra.push({ id: "m" + m.id, group: "Members", label: m.name, hint: `${m.id} · ${m.local}`, icon: User, run: () => router.push(`/portal/members/${m.id}`) }));
      const u = (k: "zone" | "centre" | "local", rows: { id: string; name: string; status?: string }[]) => rows.filter((x) => x.name.toLowerCase().includes(s)).slice(0, 4).forEach((x) => extra.push({ id: k + x.id, group: "Units", label: x.name, hint: k === "local" ? "Local PYPA" : k === "centre" ? "Centre" : "Zone", icon: MapPin, run: () => router.push(`/portal/units/${k}/${x.id}`) }));
      u("zone", tree?.zones || []); u("centre", tree?.centres || []); u("local", (tree?.locals || []).filter((l) => l.status === "Active"));
    }
    return [...extra, ...pages];
  }, [q, cmds, members, tree, router]);

  useEffect(() => setI(0), [q]);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);
  const run = (c?: Cmd) => { if (!c) return; onClose(); setTimeout(c.run, 60); };
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setI((v) => Math.min(v + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI((v) => Math.max(v - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(results[i]); }
    else if (e.key === "Escape") onClose();
  }
  let last = "";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#07181d]/55 p-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div role="dialog" aria-label="Quick search" className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" initial={{ y: -14, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 380 }}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-5 w-5 shrink-0 text-mute" />
              <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder={role === "admin" ? "Jump to a page or action…" : "Search members, units, pages or actions…"} className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute/70" aria-label="Search" />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-mute">Esc</kbd>
            </div>
            <ul ref={list} className="scroll-thin max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-4 py-10 text-center text-sm text-mute">Nothing matches “{q}”.</li>}
              {results.map((c, n) => {
                const head = c.group !== last; last = c.group;
                return (
                  <li key={c.id + n}>
                    {head && <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[.16em] text-mute">{c.group}</div>}
                    <button data-i={n} onMouseMove={() => setI(n)} onClick={() => run(c)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition", n === i ? "bg-brand text-white dark:text-[#04201a]" : "hover:bg-sunk")}>
                      <c.icon className="h-4 w-4 shrink-0 opacity-80" /><span className="truncate font-semibold">{c.label}</span>{c.hint && <span className={cn("ml-auto truncate text-xs", n === i ? "opacity-80" : "text-mute")}>{c.hint}</span>}
                      {n === i && !c.hint && <CornerDownLeft className="ml-auto h-3.5 w-3.5 opacity-80" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-4 border-t border-line bg-sunk/60 px-4 py-2.5 text-[11px] text-mute"><span><kbd className="rounded border border-line px-1">↑</kbd> <kbd className="rounded border border-line px-1">↓</kbd> move</span><span><kbd className="rounded border border-line px-1">Enter</kbd> open</span><span className="ml-auto">Press <kbd className="rounded border border-line px-1">Ctrl</kbd> <kbd className="rounded border border-line px-1">K</kbd> anywhere</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
