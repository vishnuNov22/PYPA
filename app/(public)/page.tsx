import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, HeartHandshake, Lock, Sparkles, Trophy } from "lucide-react";
import { content, stats, zoneStats } from "@/lib/public";
import { getLang, tr } from "@/lib/i18n";
import { Counter, Floating, Parallax, Reveal, ScrollBar, Spotlight, Tilt } from "@/components/public/bits";
import { ZoneExplorer } from "@/components/public/ZoneExplorer";
import { Art } from "@/components/public/Art";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function Home() {
  const c = content(), h = c.home, lang = getLang(), s = stats(), zs = zoneStats();
  const pillarIcons = [BookOpen, HeartHandshake, Trophy];
  const latest = c.kahalam[0];
  return (
    <>
      {/* hero */}
      <ScrollBar />
      <Spotlight className="relative isolate overflow-hidden bg-brand-deep text-white">
        {h.banner && <img src={h.banner} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_85%_10%,rgb(35_123_104/.55),transparent_60%),linear-gradient(160deg,#142e37,#0f2229)]" />
        <div className="grid-fade absolute inset-0 -z-10" />
        <div className="orb -left-24 top-10 -z-10 h-72 w-72 bg-brand/40" /><div className="orb -bottom-24 right-10 -z-10 h-80 w-80 bg-gold/20 [animation-delay:-6s]" />
        <div className="container relative z-10 grid items-center gap-10 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-gold"><span className="pulse-dot h-2 w-2 rounded-full bg-gold" /><Sparkles className="h-3.5 w-3.5" />{h.kicker}</span></Reveal>
            <Reveal delay={0.08}><h1 className="mt-6 font-display text-[clamp(3.2rem,9vw,6.6rem)] font-semibold leading-[.92] tracking-tight">{h.headline1} <span className="bg-gradient-to-r from-gold to-brand bg-clip-text text-transparent">{h.headline2}</span></h1></Reveal>
            <Reveal delay={0.16}><p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">{h.sub}</p></Reveal>
            <Reveal delay={0.2}><p className="font-ml mt-3 text-xl font-semibold text-gold">{h.subMl}</p></Reveal>
            <Reveal delay={0.26} className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-gold min-h-12 px-6 text-[15px]"><Lock className="h-4 w-4" />{tr(lang, "Member login", "ലോഗിൻ")}</Link>
              <Link href="/projects" className="btn min-h-12 border-white/25 bg-white/10 px-6 text-[15px] text-white hover:bg-white/20">{tr(lang, "Explore projects", "പദ്ധതികൾ കാണുക")}<ArrowRight className="h-4 w-4" /></Link>
            </Reveal>
          </div>
          <Parallax className="relative mx-auto aspect-square w-full max-w-[420px]">
            <div className="hero-rays absolute inset-[-18%] animate-spin360" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(64_196_160/.35),transparent_62%)] blur-2xl" />
            <Floating className="relative h-full w-full"><Image src="/logo.webp" alt="Pentecostal Young People’s Association emblem: Saved to Serve" fill priority sizes="420px" className="object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.5)]" /></Floating>
          </Parallax>
        </div>
        <div className="container relative z-10 pb-12">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {([[s.members, "Active members"], [s.zones, "Zones"], [s.centres, "Centres"], [s.locals, "Local PYPA units"]] as const).map(([n, l]) => (
              <div key={l} className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:bg-white/15"><dd className="font-display text-5xl font-semibold text-gold"><Counter to={n} /></dd><dt className="mt-1 text-sm text-white/75">{l}</dt></div>
            ))}
          </dl>
        </div>
      </Spotlight>

      {/* marquee */}
      <div className="overflow-hidden border-b border-line bg-brand-soft/60 py-3.5" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-[.2em] text-brand">
          {Array.from({ length: 2 }).flatMap((_, k) => ["Saved to Serve", "One register", "One voice", "One calendar", "Kerala State", "Young people for Christ"].map((t) => <span key={t + k} className="flex items-center gap-10">{t}<span className="h-1.5 w-1.5 rounded-full bg-brand" /></span>))}
        </div>
      </div>

      {/* pillars */}
      <section className="container py-20">
        <Reveal><span className="eyebrow">{tr(lang, "What we are about", "ഞങ്ങളുടെ ലക്ഷ്യം")}</span><h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">{c.about.mission}</h2></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {c.about.pillars.map(([t, x], i) => { const I = pillarIcons[i % 3]; return (
            <Reveal key={t} delay={i * 0.08}><Tilt className="card group h-full p-7 hover:shadow-pop">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white"><I className="h-6 w-6" /></span>
              <h3 className="mt-5 font-display text-2xl font-semibold">{t}</h3><p className="mt-2 leading-relaxed text-mute">{x}</p></Tilt></Reveal>
          ); })}
        </div>
      </section>

      {/* projects */}
      <section className="bg-sunk/60 py-20">
        <div className="container">
          <Reveal className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">{tr(lang, "Ongoing projects", "പദ്ധതികൾ")}</span><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">What is happening now</h2></div><Link href="/projects" className="link inline-flex items-center gap-1.5">All projects <ArrowRight className="h-4 w-4" /></Link></Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {c.projects.slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}><Tilt className="card relative h-full overflow-hidden p-7"><article><div className="absolute inset-x-0 top-0 h-1.5" style={{ background: p.color }} />
                <div className="flex items-center justify-between"><span className="pill" style={{ background: p.color + "22", color: p.color }}>{p.tag}</span><span className="text-xs font-semibold text-mute">{p.status}</span></div>
                <h3 className="mt-4 font-display text-3xl font-semibold">{p.title}</h3><p className="mt-2 leading-relaxed text-mute">{p.text}</p><p className="mt-4 text-xs font-bold uppercase tracking-wider text-mute">{p.when}</p></article></Tilt></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* zones */}
      <section className="container py-20">
        <Reveal><span className="eyebrow">{tr(lang, "Across Kerala", "കേരളത്തിലുടനീളം")}</span><h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">Explore our zones</h2><p className="mt-3 max-w-xl text-mute">Hover or tap a zone to see its centres, local PYPAs and active members. Numbers come straight from the live register.</p></Reveal>
        <Reveal delay={0.1} className="mt-10"><ZoneExplorer zones={zs} /></Reveal>
      </section>

      {/* kahalam + wall */}
      <section className="container grid gap-8 py-20 lg:grid-cols-[.9fr_1.1fr]">
        {latest && (
          <Reveal><Link href="/kahalam" className="group relative block h-full overflow-hidden rounded-3xl p-8 text-white shadow-card" style={{ background: `linear-gradient(145deg, ${latest.color}, #0f2229)` }}>
            <div className="noise absolute inset-0" />
            <span className="relative text-xs font-bold uppercase tracking-[.2em] text-gold">Latest issue · {latest.issue}</span>
            <h3 className="font-ml relative mt-4 text-4xl font-bold">{latest.title}</h3>
            <p className="relative mt-2 font-display text-2xl text-white/90">{latest.headline}</p><p className="relative mt-3 max-w-sm text-white/75">{latest.lead}</p>
            <span className="relative mt-10 inline-flex items-center gap-2 font-semibold text-gold">Read the magazine <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link></Reveal>
        )}
        <Reveal delay={0.1}><div>
          <div className="flex items-end justify-between"><div><span className="eyebrow">Wall</span><h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Made by our members</h2></div><Link href="/wall" className="link hidden items-center gap-1.5 sm:inline-flex">See the Wall <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {c.wall.slice(0, 6).map((w, i) => (
              <Link key={w.id} href="/wall" className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line">
                {w.img ? <img src={w.img} alt={w.title} className="h-full w-full object-cover" /> : <Art seed={w.seed} type={w.type} className="h-full w-full transition duration-500 group-hover:scale-105" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white"><b className="block truncate text-sm">{w.title}</b><span className="text-xs text-white/75">{w.author}</span></div>
                {i === 0 && <span className="sr-only">{fmtDate("")}</span>}
              </Link>
            ))}
          </div>
        </div></Reveal>
      </section>

      {/* cta */}
      <section className="container pb-4">
        <Reveal><div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-deep via-brand-deep to-brand p-10 text-white shadow-pop md:p-14">
          <div className="noise absolute inset-0" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div><h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Looking for work? Hiring?</h2><p className="mt-3 max-w-xl text-white/80">The PYPA Job Portal lists openings shared by members and friends. Anyone can post a vacancy for review.</p></div>
            <Link href="/jobs" className="btn btn-gold min-h-12 px-7 text-[15px]">Open the Job Portal <ArrowRight className="h-4 w-4" /></Link>
          </div></div></Reveal>
      </section>
    </>
  );
}
