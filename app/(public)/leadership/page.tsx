import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { content, pastLeaders, stateLeaders } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { Reveal } from "@/components/public/bits";
import { Avatar } from "@/components/ui/kit";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Leadership" };
export const dynamic = "force-dynamic";

export default function Leadership() {
  const c = content().leadership, cur = stateLeaders(), past = pastLeaders();
  return (
    <>
      <PageHead eyebrow="Leadership & contact" title="The State council" sub={c.note} />
      <section className="container py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cur.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06}><div className="card flex h-full flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:shadow-pop">
              <Avatar name={p.name} size={84} /><h3 className="mt-4 font-display text-xl font-semibold">{p.name}</h3>
              <span className="pill pill-warn mt-2">{p.functionary}</span><p className="mt-3 text-xs text-mute">Term ends {fmtDate(p.termEnds)}</p></div></Reveal>
          ))}
        </div>
      </section>
      <section className="container grid gap-8 pb-8 lg:grid-cols-2">
        <Reveal><div className="card h-full p-8"><span className="eyebrow">Contact the State office</span>
          <ul className="mt-5 grid gap-4 text-[15px]">
            <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-brand" />{c.office}</li>
            <li className="flex gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-brand" /><span className="font-mono">{c.phone}</span></li>
            <li className="flex gap-3"><Mail className="mt-1 h-5 w-5 shrink-0 text-brand" /><span className="break-all font-mono">{c.email}</span></li></ul>
          <div className="mt-6 flex flex-wrap gap-2">{c.social.map(([n, u]) => <a key={n} className="btn btn-sm" href={u} target="_blank" rel="noopener noreferrer">{n}</a>)}</div></div></Reveal>
        <Reveal delay={0.08}><div className="card h-full p-8"><span className="eyebrow">Past office-bearers</span>
          <ul className="mt-5 divide-y divide-line">{past.length ? past.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="font-semibold">{p.name}</span><span className="text-sm text-mute">{p.functionary} · until {fmtDate(p.termEnds)}</span></li>) : <li className="py-3 text-mute">None listed.</li>}</ul></div></Reveal>
      </section>
    </>
  );
}
