import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { getLang, NAV } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang(), user = getSession();
  return (
    <>
      <Header nav={NAV} lang={lang} signedIn={!!user} portalHref={user?.role === "admin" ? "/admin/users" : "/portal"} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
