"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Globe, LockKeyhole, Menu, ShieldCheck, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/components/ui/cn";

export function Header({ nav, lang, signedIn, portalHref }: { nav: [string, string, string][]; lang: "en" | "ml"; signedIn: boolean; portalHref: string }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sc, setSc] = useState(false);
  useEffect(() => { const f = () => setSc(window.scrollY > 12); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  const flip = () => { document.cookie = `lang=${lang === "ml" ? "en" : "ml"};path=/;max-age=31536000`; router.refresh(); };
  const t = (a: string, b: string) => (lang === "ml" ? b : a);
  return (
    <header className={cn("sticky top-0 z-40 border-b backdrop-blur-xl transition-all", sc ? "border-line bg-surface/90 shadow-card" : "border-transparent bg-surface/70")}>
      <div className={cn("container flex items-center gap-2 sm:gap-4 transition-all", sc ? "h-[58px]" : "h-[68px]")}>
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="PYPA Kerala State home">
          <Image src="/logo.webp" alt="" width={46} height={46} priority className="h-[42px] w-[42px] shrink-0 object-contain sm:h-[46px] sm:w-[46px]" />
          <span className="min-w-0 leading-tight"><b className="block truncate text-[15px]">PYPA Kerala State</b><small className="block truncate text-xs text-mute">{lang === "ml" ? "സേവനത്തിനായി രക്ഷിക്കപ്പെട്ടവർ" : "Saved to Serve"}</small></span>
        </Link>
        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Main"><LayoutGroup id="pubnav">
          {nav.map(([href, en, ml]) => (
            <Link key={href} href={href} className={cn("relative rounded-lg px-3 py-2 text-sm font-semibold transition hover:text-brand", path === href ? "text-brand" : "text-ink/80")}>
              {path === href && <motion.span layoutId="pub-pill" className="absolute inset-0 -z-10 rounded-lg bg-brand-soft" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}{t(en, ml)}</Link>
          ))}</LayoutGroup>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 lg:ml-3">
          <button onClick={flip} className="btn btn-sm hidden sm:inline-flex"><Globe className="h-4 w-4" />{lang === "ml" ? "English" : "മലയാളം"}</button>
          <ThemeToggle />
          {signedIn
            ? <Link href={portalHref} className="btn btn-pri btn-sm"><ShieldCheck className="h-4 w-4" />{t("Portal", "പോർട്ടൽ")}</Link>
            : <Link href="/login" className="btn btn-pri btn-sm"><LockKeyhole className="h-4 w-4" />{t("Login", "ലോഗിൻ")}</Link>}
          <button className="btn btn-ghost btn-sm !px-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <nav className="container grid gap-1 border-t border-line pb-4 pt-2 lg:hidden" aria-label="Mobile">
          {nav.map(([href, en, ml]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-3 text-[15px] font-semibold", path === href ? "bg-brand-soft text-brand" : "hover:bg-sunk")}>{t(en, ml)}</Link>)}
          <button onClick={flip} className="btn mt-1 justify-start"><Globe className="h-4 w-4" />{lang === "ml" ? "English" : "മലയാളം"}</button>
        </nav>
      )}
    </header>
  );
}
