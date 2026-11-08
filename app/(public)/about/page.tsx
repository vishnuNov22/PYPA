import type { Metadata } from "next";
import { content } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { Reveal } from "@/components/public/bits";

export const metadata: Metadata = { title: "About PYPA" };
export const dynamic = "force-dynamic";

export default function About() {
  const a = content().about;
  const words = [["P", "Pentecostal"], ["Y", "Young"], ["P", "People’s"], ["A", "Association"]];
  return (
    <>
      <PageHead eyebrow="About PYPA" title="Saved to serve, together." sub={a.stands} />
      <section className="container grid gap-6 py-16 md:grid-cols-2">
        {[["Our mission", a.mission], ["Our vision", a.vision]].map(([t, x], i) => (
          <Reveal key={t} delay={i * 0.08}><div className="card h-full p-8"><span className="eyebrow">{t}</span><p className="mt-4 font-display text-2xl leading-snug sm:text-[28px]">{x}</p></div></Reveal>
        ))}
      </section>
      <section className="container pb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {words.map(([l, w], i) => <Reveal key={i} delay={i * 0.06}><div className="rounded-3xl bg-brand p-6 text-white dark:text-[#04201a]"><div className="font-display text-6xl font-semibold text-gold dark:text-[#04201a]">{l}</div><div className="mt-1 text-sm font-semibold uppercase tracking-wider">{w}</div></div></Reveal>)}
        </div>
      </section>
      <section className="container py-16">
        <Reveal><span className="eyebrow">Our history</span><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">How PYPA grew</h2></Reveal>
        <ol className="relative mt-10 grid gap-8 border-l-2 border-gold/60 pl-8">
          {a.history.map(([t, x], i) => (
            <Reveal key={i} delay={i * 0.05}><li className="relative"><span className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-4 border-bg bg-gold" /><h3 className="font-display text-2xl font-semibold">{t}</h3><p className="mt-1.5 max-w-2xl leading-relaxed text-mute">{x}</p></li></Reveal>
          ))}
        </ol>
      </section>
    </>
  );
}
