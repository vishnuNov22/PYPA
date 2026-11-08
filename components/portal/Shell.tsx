"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Bell, ChevronsUpDown, Globe, KeyRound, LockKeyhole, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/components/ui/cn";
import { FormModal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/kit";
import { rpc, useRpc } from "@/lib/client";
import { ago } from "@/lib/format";
import { menuFor } from "./menu";
import { CommandPalette } from "./CommandPalette";
import type { Role } from "@/lib/types";

interface Info { unread: number; label: string; roleName: string; freeze: { remarks: string; end: string } | null }
interface N { id: string; title: string; body: string; date: string; read: boolean; go?: string }

export function Shell({ role, unitId, email, children }: { role: Role; unitId: string | null; email: string; children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const [open, setOpen] = useState(false), [bell, setBell] = useState(false), [menu, setMenu] = useState(false), [pw, setPw] = useState(false);
  const [cur, setCur] = useState(""), [n1, setN1] = useState(""), [n2, setN2] = useState("");
  const [pal, setPal] = useState(false), [rail, setRail] = useState(false);
  useEffect(() => { try { setRail(localStorage.getItem("pypa-rail") === "1"); } catch {} }, []);
  const toggleRail = () => setRail((v) => { try { localStorage.setItem("pypa-rail", v ? "0" : "1"); } catch {} return !v; });
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((v) => !v); } }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, []);
  const items = menuFor(role, unitId);
  const { data: info } = useRpc<Info>("shell.info", {}, { refreshInterval: 60000 });
  const { data: notifs, mutate } = useRpc<N[]>(role !== "admin" && bell ? "notif.list" : null);
  const active = (h: string) => (h === "/portal" ? path === "/portal" : path === h || path.startsWith(h + "/"));
  const isOn = (it: { href: string; sub?: { href: string }[] }) => {
    if (it.sub) return path === it.href || it.sub.some((s) => path === s.href) || (it.href.includes("/units/") && path.startsWith(it.href));
    return active(it.href);
  };
  const logout = useCallback(async () => { await rpc("auth.logout"); router.replace("/login"); router.refresh(); }, [router]);
  const openPw = useCallback(() => setPw(true), []);

  const nav = (
    <nav className="scroll-thin flex-1 overflow-y-auto overflow-x-hidden px-3 py-2" aria-label="Portal">
      <LayoutGroup id="side">
      {items.map((it) => it.group ? <div key={it.label} className={cn("mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/45", rail && "lg:invisible lg:h-3")}>{it.label}</div> : (
        <div key={it.href + it.label}>
          <Link href={it.href} title={rail ? it.label : undefined} onClick={() => setOpen(false)} className={cn("relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", isOn(it) ? "text-white" : "text-white/70 hover:bg-white/[.07] hover:text-white", rail && "lg:justify-center lg:px-0")}>
            {isOn(it) && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-white/[.13] ring-1 ring-white/10" transition={{ type: "spring", damping: 30, stiffness: 380 }}><span className="absolute left-0 top-2.5 h-[calc(100%-20px)] w-[3px] rounded-full bg-gold" /></motion.span>}
            {it.icon && <it.icon className="relative h-[18px] w-[18px] shrink-0" />}<span className={cn("relative truncate", rail && "lg:hidden")}>{it.label}</span>
          </Link>
          <AnimatePresence initial={false}>
            {it.sub && isOn(it) && !rail && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-1 ml-6 grid gap-0.5 border-l border-white/15 pl-3 pt-0.5">
                  {it.sub.map((s) => <Link key={s.href + s.label} href={s.href} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-2 text-[13px] font-semibold transition", path === s.href ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/[.07] hover:text-white")}>{s.label}</Link>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      </LayoutGroup>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--sw)_1fr] lg:transition-[grid-template-columns] lg:duration-300" style={{ "--sw": rail ? "84px" : "272px" } as React.CSSProperties}>
      {open && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-brand-deep text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="orb -left-16 top-24 h-56 w-56 bg-brand/40" /><div className="orb -bottom-10 right-[-60px] h-48 w-48 bg-gold/15" style={{ animationDelay: "-6s" }} /></div>
        <Link href={role === "admin" ? "/admin/users" : "/portal"} className={cn("relative flex items-center gap-3 px-5 py-5", rail && "lg:justify-center lg:px-0")}><Image src="/logo.webp" alt="" width={42} height={42} className="h-[42px] w-[42px] rounded-full bg-white object-contain p-0.5" />
          <span className={cn("leading-tight", rail && "lg:hidden")}><b className="block">PYPA Kerala</b><small className="text-xs text-white/60">{info?.roleName || (role === "admin" ? "Admin" : "")} portal</small></span></Link>
        <div className="relative flex min-h-0 flex-1 flex-col">{nav}</div>
        <div className="relative border-t border-white/10 p-4">
          <div className={cn("flex items-center gap-3", rail && "lg:justify-center")}><Avatar name={info?.label || email} size={38} /><div className={cn("min-w-0 flex-1", rail && "lg:hidden")}><b className="block truncate text-sm">{info?.label || "…"}</b><span className="block truncate text-xs text-white/55">{email}</span></div>
            <button onClick={toggleRail} className={cn("hidden rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white lg:block", rail && "lg:hidden")} aria-label="Collapse sidebar"><PanelLeftClose className="h-[18px] w-[18px]" /></button></div>
          {rail && <button onClick={toggleRail} className="mx-auto mt-3 hidden rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white lg:block" aria-label="Expand sidebar"><PanelLeftOpen className="h-[18px] w-[18px]" /></button>}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button className="btn btn-ghost btn-sm !px-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <button onClick={() => setPal(true)} className="group hidden h-10 w-full max-w-md items-center gap-3 rounded-xl border border-line bg-sunk/60 px-3.5 text-sm text-mute transition hover:border-brand/40 hover:bg-surface sm:flex" aria-label="Open quick search"><Search className="h-4 w-4" /><span className="truncate">Search members, units, pages…</span><kbd className="ml-auto rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px]">Ctrl K</kbd></button>
          <span className="truncate text-sm font-semibold text-mute sm:hidden">{info?.label}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <button className="btn btn-ghost btn-sm !px-2.5 sm:hidden" onClick={() => setPal(true)} aria-label="Search"><Search className="h-[18px] w-[18px]" /></button>
            <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex"><Globe className="h-4 w-4" />Public site</Link>
            <ThemeToggle />
            {role !== "admin" && (
              <div className="relative">
                <button className="btn btn-ghost btn-sm relative !px-2.5" onClick={() => { setBell(!bell); setMenu(false); }} aria-label="Notifications"><Bell className="h-[18px] w-[18px]" />
                  {!!info?.unread && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white dark:text-[#04201a] pulse-dot">{info.unread}</span>}</button>
                {bell && (<>
                  <div className="fixed inset-0 z-40" onClick={() => setBell(false)} />
                  <div className="fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px]">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3"><b>Notifications</b><button className="text-xs font-semibold text-brand hover:underline" onClick={async () => { await rpc("notif.read", {}); mutate(); }}>Mark all read</button></div>
                    <ul className="scroll-thin max-h-[380px] divide-y divide-line overflow-y-auto">
                      {!notifs && <li className="px-4 py-8 text-center text-sm text-mute">Loading…</li>}
                      {notifs?.slice(0, 8).map((n) => (
                        <li key={n.id}><button className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-sunk", n.read && "opacity-65")} onClick={async () => { setBell(false); await rpc("notif.read", { id: n.id }); mutate(); router.push(n.go || "/portal/notifications"); }}>
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-line" : "bg-brand")} /><span className="min-w-0"><b className="block text-sm">{n.title}</b><span className="line-clamp-2 text-[13px] text-mute">{n.body}</span><span className="text-[11px] text-mute">{ago(n.date)}</span></span></button></li>
                      ))}
                      {notifs?.length === 0 && <li className="px-4 py-8 text-center text-sm text-mute">You are all caught up.</li>}
                    </ul>
                    <Link href="/portal/notifications" onClick={() => setBell(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-sunk">View all notifications</Link>
                  </div></>)}
              </div>
            )}
            <div className="relative">
              <button className="btn btn-sm gap-2 !pl-1.5" onClick={() => { setMenu(!menu); setBell(false); }}><Avatar name={info?.label || email} size={26} /><ChevronsUpDown className="h-3.5 w-3.5 text-mute" /></button>
              {menu && (<>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
                  <div className="px-3 py-2"><b className="block truncate text-sm">{info?.label}</b><span className="block truncate text-xs text-mute">{email}</span></div><hr className="my-1 border-line" />
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-sunk" onClick={() => { setMenu(false); setPw(true); }}><KeyRound className="h-4 w-4" />Change password</button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-bad hover:bg-bad-soft" onClick={logout}><LogOut className="h-4 w-4" />Sign out</button>
                </div></>)}
            </div>
          </div>
        </header>
        {info?.freeze && (
          <div className="flex items-start gap-3 border-b border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn sm:px-6"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <span><b>Edits are frozen.</b> {info.freeze.remarks || "State has paused edits."} Until {new Date(info.freeze.end).toLocaleString("en-IN")}.</span></div>
        )}
        <motion.main key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">{children}</motion.main>
      </div>

      <CommandPalette open={pal} onClose={() => setPal(false)} role={role} unitId={unitId} onSignOut={logout} onPassword={openPw} />
      <FormModal open={pw} onClose={() => setPw(false)} title="Change password" submitLabel="Update password" size="sm"
        onSubmit={async () => { if (n1 !== n2) { toast.error("The two new passwords differ."); return false; } try { await rpc("auth.changePassword", { current: cur, password: n1 }); toast.success("Password changed."); setCur(""); setN1(""); setN2(""); } catch (e) { toast.error((e as Error).message); return false; } }}>
        <Field label="Current password" required><Input type="password" required value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="New password" required hint="At least 8 characters, with letters and numbers"><Input type="password" required value={n1} onChange={(e) => setN1(e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Confirm new password" required><Input type="password" required value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" /></Field>
      </FormModal>
    </div>
  );
}
