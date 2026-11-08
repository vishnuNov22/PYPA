"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { Issue } from "@/lib/types";

function samplePages(k: Issue) {
  return [
    { kind: "cover" as const, title: k.title, a: k.issue, b: k.headline },
    { kind: "page" as const, h: "Editor’s note", t: k.lead + " Every issue carries news from zones, centres and local units, plus teaching and testimonies written by young people." },
    { kind: "page" as const, h: "Inside this issue", t: "Niravu and Chuvadu reports · Camp dates and registration · Talent test rules and categories · Member testimonies · Zone news · Job notices" },
    { kind: "page" as const, h: "From the State office", t: "Please send news and photographs from your unit through your centre secretary before the 20th of each month." },
  ];
}

export function KahalamReader({ issues }: { issues: Issue[] }) {
  const [id, setId] = useState(issues[0]?.id);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const k = issues.find((i) => i.id === id) || issues[0];
  if (!k) return <p className="text-mute">No issues have been published yet.</p>;
  const pages = samplePages(k);
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:overflow-visible" aria-label="Issues">
        {issues.map((i) => (
          <button key={i.id} onClick={() => { setId(i.id); setPage(0); }} className={cn("group flex min-w-[200px] items-center gap-3 rounded-2xl border p-3 text-left transition lg:min-w-0", i.id === k.id ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-sunk")}>
            <span className="grid h-16 w-12 shrink-0 place-items-center rounded-md text-center font-ml text-[9px] font-bold leading-tight text-white shadow-card" style={{ background: i.color }}>{i.title}</span>
            <span className="min-w-0"><b className="block truncate text-sm">{i.issue}</b><span className="line-clamp-2 text-xs text-mute">{i.headline}</span></span>
          </button>
        ))}
      </aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-ml text-2xl font-bold">{k.title} <span className="font-sans text-base font-semibold text-mute">· {k.issue}</span></h2>{!k.pdf && <p className="text-sm text-mute">Sample pages. The full PDF appears here once it is uploaded in the admin area.</p>}</div>
          {k.pdf && <a href={k.pdf} target="_blank" rel="noopener noreferrer" className="btn btn-pri btn-sm"><ExternalLink className="h-4 w-4" />Open PDF in new tab</a>}
        </div>
        {k.pdf ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-sunk shadow-card"><iframe src={`${k.pdf}#view=FitH`} title={`${k.title} ${k.issue}`} className="h-[78vh] w-full" /></div>
        ) : (
          <div className="rounded-3xl bg-sunk p-4 sm:p-8">
            <div className="relative mx-auto" style={{ maxWidth: zoom ? 720 : 480 }}>
              <AnimatePresence mode="wait">
                <motion.div key={id + page} initial={{ opacity: 0, rotateY: -14, x: 24 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}
                  className="aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-pop" style={{ transformPerspective: 1200 }}>
                  {pages[page].kind === "cover" ? (
                    <div className="relative flex h-full flex-col justify-between p-8 text-white" style={{ background: `linear-gradient(160deg, ${k.color}, #0f2229)` }}>
                      <span className="text-xs font-bold uppercase tracking-[.2em] text-gold">{pages[page].a}</span>
                      <div><h3 className="font-ml text-5xl font-bold leading-tight">{pages[page].title}</h3><p className="mt-3 font-display text-2xl text-white/90">{pages[page].b}</p></div>
                      <span className="text-xs text-white/60">PYPA Kerala State</span>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col p-8 text-[#201317]"><h3 className="font-display text-3xl font-semibold" style={{ color: k.color }}>{pages[page].h}</h3><hr className="my-4 border-black/10" /><p className="text-[15px] leading-relaxed">{pages[page].t}</p>
                      <div className="mt-auto flex items-center justify-between text-xs text-black/40"><span>{k.title} · {k.issue}</span><span>{page + 1}</span></div></div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span className="min-w-20 text-center text-sm font-semibold"><FileText className="mr-1 inline h-4 w-4" />{page + 1} / {pages.length}</span>
              <button className="btn btn-sm" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              <button className="btn btn-sm" onClick={() => setZoom(!zoom)} aria-label="Zoom">{zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
