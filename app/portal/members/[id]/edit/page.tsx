"use client";
import { useParams } from "next/navigation";
import { MemberForm } from "@/components/portal/MemberForm";
import { Banner, Card, PageHeader } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import type { Member } from "@/lib/types";

export default function EditMember() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useRpc<{ member: Member; canEdit: boolean }>("members.get", { id });
  if (error) return <Card><p className="text-bad">{(error as Error).message}</p></Card>;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-sunk" />;
  if (!data.canEdit) return <Banner tone="warn">You can view this member but not edit them.</Banner>;
  const { paid, photo, zone, centre, local, ...rest } = data.member as Member & Record<string, unknown>;
  void paid; void photo; void zone; void centre; void local;
  return (<><PageHeader title={`Edit ${data.member.name}`} crumbs={[{ label: "Members", href: "/portal/members" }, { label: data.member.name, href: `/portal/members/${id}` }, { label: "Edit" }]} /><MemberForm id={id} initial={rest as unknown as Record<string, string>} /></>);
}
