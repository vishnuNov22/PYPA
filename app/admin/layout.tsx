import { redirect } from "next/navigation";
import { Shell } from "@/components/portal/Shell";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = getSession();
  if (!u) redirect("/login");
  if (u.role !== "admin") redirect("/portal");
  return <Shell role="admin" unitId={null} email={u.email}>{children}</Shell>;
}
