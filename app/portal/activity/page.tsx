"use client";
import { DataTable, type Col, type TFilter } from "@/components/ui/DataTable";
import { PageHeader, Pill } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import { fmtDT } from "@/lib/format";
import type { Activity } from "@/lib/types";

export default function ActivityLogs() {
  const { data } = useRpc<Activity[]>("activity.list");
  const users = Array.from(new Set((data || []).map((a) => a.user))).sort();
  const filters: TFilter<Activity>[] = [
    { key: "user", label: "User", type: "combo", options: users, test: (r, v) => r.user === v },
    { key: "type", label: "Activity", options: ["Add", "Edit"], test: (r, v) => r.type === v },
    { key: "from", label: "From date", type: "date", test: (r, v) => r.date.slice(0, 10) >= v },
    { key: "to", label: "To date", type: "date", test: (r, v) => r.date.slice(0, 10) <= v },
  ];
  const cols: Col<Activity>[] = [
    { key: "date", label: "Date & time", sortable: true, get: (r) => r.date, render: (r) => <span className="whitespace-nowrap">{fmtDT(r.date)}</span> },
    { key: "user", label: "User", sortable: true, get: (r) => r.user },
    { key: "type", label: "Type", get: (r) => r.type, render: (r) => <Pill tone={r.type === "Add" ? "ok" : "info"}>{r.type}</Pill> },
    { key: "desc", label: "Description", get: (r) => r.desc, className: "min-w-[280px]" },
  ];
  return (
    <>
      <PageHeader title="Activity logs" sub="Every add and edit made in your scope, newest first." />
      <DataTable<Activity> rows={data} cols={cols} rowKey={(r) => r.id} filters={filters} searchOf={(r) => `${r.user} ${r.desc}`} searchPlaceholder="Search activity" defaultSort={["date", -1]}
        exportName="Activity logs" exportCols={[["Date", (r) => r.date], ["User", (r) => r.user], ["Type", (r) => r.type], ["Description", (r) => r.desc]]} />
    </>
  );
}
