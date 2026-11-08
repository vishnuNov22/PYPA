import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { content } from "@/lib/public";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function Login() {
  const u = getSession();
  if (u) redirect(u.role === "admin" ? "/admin/users" : "/portal");
  const d = db();
  const demos = process.env.PYPA_DEMO === "off" ? [] : [
    { label: "Admin", email: "admin@pypakerala.example" }, { label: "State", email: "state@pypakerala.example" },
    { label: "Zone (Kottayam)", email: d.zones.find((z) => z.id === "Z4")!.admin.email },
    { label: "Centre (Kottayam South)", email: d.centres.find((c) => c.id === "C8")!.admin.email },
    { label: "Local PYPA", email: d.locals.find((l) => l.centreId === "C8" && l.registered)!.admin.email },
  ];
  const c = content().leadership;
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-deep text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_20%_10%,rgb(35_123_104/.6),transparent_60%),linear-gradient(160deg,#142e37,#0c1d23)]" />
        <div className="grid-fade absolute inset-0" />
        <div className="orb -left-20 top-1/3 h-72 w-72 bg-brand/40" /><div className="orb bottom-0 right-0 h-80 w-80 bg-gold/20 [animation-delay:-5s]" />
        <div className="hero-rays absolute -left-1/4 top-1/4 h-[130%] w-[130%] animate-spin360 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to the website</Link>
          <div><Image src="/logo.webp" alt="PYPA emblem" width={160} height={160} className="drop-shadow-2xl" priority />
            <h1 className="mt-8 font-display text-6xl font-semibold leading-none">Portal<br /><span className="bg-gradient-to-r from-gold to-brand bg-clip-text text-transparent">login</span></h1>
            <p className="mt-5 max-w-md text-lg text-white/80">One login for State, Zone, Centre and Local PYPA administrators. Use the email address your unit was registered with.</p>
            <ul className="mt-6 grid max-w-md gap-2.5 text-sm text-white/85">
              {["Members, dues and payments in one place", "Events, projects and the Wall for every unit", "Every change tracked in an audit log"].map((t) => <li key={t} className="glass flex items-center gap-3 rounded-xl px-4 py-2.5"><span className="h-2 w-2 rounded-full bg-gold" />{t}</li>)}
            </ul>
            <p className="font-ml mt-6 text-xl font-semibold text-gold">സേവനത്തിനായി രക്ഷിക്കപ്പെട്ടവർ</p></div>
          <p className="text-xs text-white/50">PYPA Kerala State · Saved to Serve</p>
        </div>
      </aside>
      <main className="flex items-center justify-center bg-bg p-6 sm:p-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-between lg:hidden"><Link href="/" className="inline-flex items-center gap-2 text-sm text-mute"><ArrowLeft className="h-4 w-4" />Website</Link><ThemeToggle /></div>
          <Image src="/logo.webp" alt="" width={64} height={64} className="mb-5 lg:hidden" />
          <h2 className="font-display text-4xl font-semibold">Sign in</h2>
          <p className="mb-7 mt-1.5 text-mute">Welcome back. Enter your username and password.</p>
          <LoginForm demos={demos} contact={{ office: c.office, phone: c.phone, email: c.email }} />
        </div>
      </main>
    </div>
  );
}
