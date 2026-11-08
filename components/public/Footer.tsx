import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { content } from "@/lib/public";
import { NAV } from "@/lib/i18n";

export function Footer() {
  const c = content().leadership;
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-deep text-white">
      <div className="noise absolute inset-0 opacity-60" />
      <div className="container relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3"><Image src="/logo.webp" alt="" width={56} height={56} className="h-14 w-14 object-contain" /><div><b className="block text-lg">PYPA Kerala State</b><span className="text-sm text-white/70">India’s Largest Pentecostal Youth Organization</span></div></div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75">Saved to Serve. One register, one voice and one calendar for every local PYPA, centre and zone in Kerala.</p>
        </div>
        <div>
          <b className="text-sm uppercase tracking-widest text-gold">Explore</b>
          <ul className="mt-4 grid gap-2 text-sm text-white/80">{NAV.slice(1).map(([h, n]) => <li key={h}><Link href={h} className="hover:text-white hover:underline">{n}</Link></li>)}<li><Link href="/login" className="hover:text-white hover:underline">Member login</Link></li></ul>
        </div>
        <div>
          <b className="text-sm uppercase tracking-widest text-gold">Contact</b>
          <ul className="mt-4 grid gap-3 text-sm text-white/80">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{c.office}</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span className="font-mono">{c.phone}</span></li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span className="font-mono break-all">{c.email}</span></li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">{c.social.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="text-white/80 underline-offset-4 hover:text-white hover:underline">{n}</a>)}</div>
        </div>
      </div>
      <div className="container relative border-t border-white/10 py-5 text-xs text-white/55">© {new Date().getFullYear()} PYPA Kerala State. All rights reserved.</div>
    </footer>
  );
}
