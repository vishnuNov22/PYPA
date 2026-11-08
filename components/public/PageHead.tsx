export function PageHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-brand-deep text-white">
      <div className="grid-fade absolute inset-0 -z-10" />
      <div className="orb -right-16 -top-20 -z-10 h-64 w-64 bg-brand/40" />
      <div className="container py-14 sm:py-20">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-gold"><span className="h-px w-8 bg-gold" />{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1.02] tracking-tight">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-lg text-white/75">{sub}</p>}
      </div>
    </section>
  );
}
