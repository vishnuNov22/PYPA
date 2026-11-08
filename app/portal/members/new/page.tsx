"use client";
import { MemberForm } from "@/components/portal/MemberForm";
import { PageHeader } from "@/components/ui/kit";

export default function NewMember() {
  return (<><PageHeader title="Add member" sub="The member ID is generated automatically using the format set by the Portal Administrator." crumbs={[{ label: "Members", href: "/portal/members" }, { label: "Add" }]} /><MemberForm /></>);
}
