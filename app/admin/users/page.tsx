"use client";
import { UsersReset } from "@/components/portal/UsersReset";
import { PageHeader } from "@/components/ui/kit";

export default function AdminUsers() {
  return (<><PageHeader title="User management" sub="Every zone, centre and local PYPA account. Change a username (email) or send a new temporary password." /><UsersReset /></>);
}
