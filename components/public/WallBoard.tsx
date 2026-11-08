"use client";
import { useState } from "react";
import { Feather, Image as ImageIcon, Music2, PenLine } from "lucide-react";
import { Art } from "./Art";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/cn";
import type { WallItem } from "@/lib/types";

const textual = (t: string) => t === "Poem" || t === "Short story";
const Icon = ({ t }: { t: string }) => (t === "Poem" ? <Feather className="h-3.5 w-3.5" /> : t === "Short story" ? <PenLine className="h-3.5 w-3.5" /> : t === "Music" ? <Music2 className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />);

export function WallBoard({ items }: { items: WallItem[] }) {
  const types = ["All", ...Array.from(new Set(items.map((i) => i.type)))];
  const [f, setF] = useState("All");
  const [open, setOpen] = useState<WallItem | null>(null);
  const list = items.filter((i) => f === "All" || i.type === f);
  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist">{types.map((t) => <button key={t} role="tab" aria-selected={f === t} onClick={() => setF(t)} className={cn("btn btn-sm", f === t && "btn-pri")}>{t}</button>)}</div>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {list.map((w) => (
          <button key={w.id} onClick={() => setOpen(w)} className="card group block w-full break-inside-avoid overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-pop">
            {textual(w.type) ? (
              <div className="bg-gradient-to-br from-gold-soft to-surface p-7"><p className={cn("line-clamp-6 whitespace-pre-line font-display text-xl leading-relaxed", /[ഀ-ൿ]/.test(w.text || "") && "font-ml")}>{w.text}</p></div>
            ) : w.img ? <img src={w.img} alt={w.title} className="aspect-[4/3] w-full object-cover" /> : <Art seed={w.seed} type={w.type} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-[1.03]" />}
            <div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><h3 className="truncate font-semibold">{w.title}</h3><p className="truncate text-sm text-mute">{w.author} · {w.unit}</p></div><span className="pill shrink-0"><Icon t={w.type} />{w.type}</span></div>
          </button>
        ))}
        {list.length === 0 && <p className="text-mute">Nothing here yet.</p>}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title || ""} size="lg">
        {open && (
          <div className="grid gap-4">
            {textual(open.type)
              ? <p className={cn("whitespace-pre-line font-display text-2xl leading-loose", /[ഀ-ൿ]/.test(open.text || "") && "font-ml")}>{open.text}</p>
              : open.img ? <img src={open.img} alt={open.title} className="max-h-[60vh] w-full rounded-2xl object-contain" /> : <Art seed={open.seed} type={open.type} className="aspect-[4/3] w-full rounded-2xl" />}
            <p className="text-sm text-mute">By <b className="text-ink">{open.author}</b> · {open.unit} · {open.type}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
