"use client";
import { useState } from "react";
import { CouncilTable, type CouncilRow } from "@/components/portal/UnitBits";
import { useMe } from "@/components/portal/useMe";
import { Card, PageHeader, Tabs } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";

export default function Council() {
  const me = useMe();
  const [tab, setTab] = useState<"current" | "past">("current");
  const { data } = useRpc<CouncilRow[]>("council.list");
  const kind = me?.role === "admin" ? "state" : me?.role || "state";
  const id = me?.role === "state" ? "ST-KL" : me?.unitId || "ST-KL";
  const { data: u } = useRpc<{ canEdit: boolean }>(me ? "units.get" : null, { kind, id });
  const rows = (data || []).filter((r) => (tab === "current" ? r.current : !r.current));
  return (
    <>
      <PageHeader title="Council members" sub="Current office-bearers and past council members of your unit." />
      <Card pad={false}>
        <div className="border-b border-line px-5 pt-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: "current", label: "Current council", count: (data || []).filter((r) => r.current).length }, { id: "past", label: "Past council", count: (data || []).filter((r) => !r.current).length }]} /></div>
        <div className="p-5">{!data ? <div className="h-32 animate-pulse rounded-xl bg-sunk" /> : <CouncilTable kind={kind} id={id} rows={rows} editable={!!u?.canEdit} />}</div>
      </Card>
    </>
  );
}
