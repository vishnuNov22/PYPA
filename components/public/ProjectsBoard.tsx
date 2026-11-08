"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { Project } from "@/lib/types";

export function ProjectsBoard({ projects }: { projects: Project[] }) {
  const tags = ["All", ...Array.from(new Set(projects.map((p) => p.tag)))];
  const [f, setF] = useState("All");
  const list = projects.filter((p) => f === "All" || p.tag === f);
  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist">{tags.map((t) => <button key={t} role="tab" aria-selected={f === t} onClick={() => setF(t)} className={cn("btn btn-sm", f === t && "btn-pri")}>{t}</button>)}</div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <article key={p.id} className="card relative flex flex-col overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-pop">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: p.color }} />
            <div className="flex items-center justify-between gap-2"><span className="pill" style={{ background: p.color + "22", color: p.color }}>{p.tag}</span>
              <span className={cn("pill", p.status === "Ongoing" ? "pill-ok" : p.status === "Registration open" ? "pill-warn" : "")}>{p.status}</span></div>
            <h3 className="mt-5 font-display text-3xl font-semibold">{p.title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-mute">{p.text}</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-brand" />{p.when}</p>
          </article>
        ))}
      </div>
    </>
  );
}
