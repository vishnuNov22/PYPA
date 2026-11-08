import type { Role } from "@/lib/types";
import { BookOpenText, Building2, FileText, Gauge, Layers, LayoutDashboard, Mail, MapPin, Settings2, Shield, Trophy, Users, Activity, Briefcase, Image as Img, Home, SlidersHorizontal, type LucideIcon } from "lucide-react";

export interface MenuItem { href: string; label: string; icon?: LucideIcon; sub?: { href: string; label: string }[]; group?: string }

export function menuFor(role: Role, unitId: string | null): MenuItem[] {
  if (role === "admin") return [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/master", label: "Master Data", icon: SlidersHorizontal },
    { href: "/admin/outbox", label: "Email log", icon: Mail },
    { href: "", label: "Content management", group: "1" },
    { href: "/admin/content/home", label: "Home", icon: Home },
    { href: "/admin/content/about", label: "About", icon: BookOpenText },
    { href: "/admin/content/leadership", label: "Leadership", icon: Shield },
    { href: "/admin/content/projects", label: "Ongoing Projects", icon: Layers },
    { href: "/admin/content/kahalam", label: "Yuvajana Kahalam", icon: FileText },
    { href: "/admin/content/wall", label: "Wall", icon: Img },
    { href: "/admin/content/jobs", label: "Job Portal", icon: Briefcase },
  ];
  const id = role === "state" ? "ST-KL" : unitId;
  const own = role === "state" ? "State" : role === "zone" ? "Zone" : role === "centre" ? "Centre" : "Local PYPA";
  const m: MenuItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: `/portal/units/${role}/${id}`, label: own, icon: Building2, sub: [{ href: `/portal/units/${role}/${id}`, label: `${own === "Local PYPA" ? "Local" : own} View` }, { href: `/portal/units/${role}/${id}/edit`, label: `${own === "Local PYPA" ? "Local" : own} Edit` }] },
  ];
  if (role === "state") m.push({ href: "/portal/units/zone", label: "Zone", icon: MapPin });
  if (role === "state" || role === "zone") m.push({ href: "/portal/units/centre", label: "Centre", icon: MapPin });
  if (role === "centre") m.push({ href: "/portal/units/local", label: "Local PYPA", icon: MapPin });
  if (role === "state" || role === "zone") m.push({ href: "/portal/units/local", label: "Local PYPA", icon: MapPin });
  const sub = [{ href: "/portal/members/dues", label: "Member Dues Calculation" }];
  if (role === "centre" || role === "local") sub.push({ href: "/portal/members/duplicates", label: "Member Duplicate Page" });
  m.push({ href: "/portal/members", label: "Member", icon: Users, sub },
    { href: "/portal/council", label: "Council Members", icon: Shield }, { href: "/portal/letters", label: "Letter", icon: Mail },
    { href: "/portal/activity", label: "Activity Logs", icon: Activity }, { href: "/portal/talent", label: "Talent Test", icon: Trophy });
  if (role === "state") m.push({ href: "/portal/admin", label: "Admin Panel", icon: Settings2 });
  return m;
}
void Gauge;
