"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export function Modal({ open, onClose, title, children, size = "md", footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl"; footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>("input:not([readonly]):not([type=hidden]),select,textarea")?.focus({ preventScroll: true }), 80);
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; clearTimeout(t); };
  }, [open, onClose]);
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#07181d]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title}
            className={cn("flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:rounded-3xl", w)}
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 320 }}>
            <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <button onClick={onClose} className="btn btn-ghost btn-sm !px-2" aria-label="Close"><X className="h-4 w-4" /></button>
            </header>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-sunk/50 px-5 py-3.5">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A modal that wraps its content in a form with Cancel + Submit. Return false from onSubmit to keep it open. */
export function FormModal({ open, onClose, title, children, onSubmit, submitLabel = "Save", size = "md", hideCancel, danger, extra }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; onSubmit: () => Promise<boolean | void> | boolean | void;
  submitLabel?: string; size?: "sm" | "md" | "lg" | "xl"; hideCancel?: boolean; danger?: boolean; extra?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const id = useRef("f" + Math.random().toString(36).slice(2, 7)).current;
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { const r = await onSubmit(); if (r !== false) onClose(); } finally { setBusy(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} size={size}
      footer={<>{extra}{!hideCancel && <button type="button" className="btn" onClick={onClose}>Cancel</button>}
        <button form={id} type="submit" disabled={busy} className={cn("btn", danger ? "btn-bad" : "btn-pri")}>{busy ? "Working…" : submitLabel}</button></>}>
      <form id={id} onSubmit={go} className="grid gap-4">{children}</form>
    </Modal>
  );
}
