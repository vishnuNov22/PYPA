import { redirect } from "next/navigation";
import { Shell } from "@/components/portal/Shell";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const u = getSession();
  if (!u) redirect("/login");
  if (u.role === "admin") redirect("/admin/users");
  return <Shell role={u.role} unitId={u.unitId} email={u.email}>{children}</Shell>;
}
