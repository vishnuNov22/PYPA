"use client";
import Link from "next/link";
import { Ban, CheckCircle2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Confirm";
import { Card, Empty, PageHeader } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";

interface D { id: string; name: string; mobile: string; email: string; local: string; centre: string; canMark: boolean }

export default function Duplicates() {
  const { data } = useRpc<D[][]>("members.dupes");
  const [ask, dialog] = useConfirm();
  return (
    <>
      {dialog}
      <PageHeader title="Duplicate members" sub="Members with the same name and a matching mobile number or email. Keep the correct record and mark the other inactive as Duplicate." crumbs={[{ label: "Members", href: "/portal/members" }, { label: "Duplicates" }]} />
      {!data ? <div className="h-40 animate-pulse rounded-2xl bg-sunk" /> : data.length === 0 ? <Card><Empty icon={<CheckCircle2 className="h-8 w-8 text-leaf" />}>No duplicates found in your scope.</Empty></Card> : (
        <div className="grid gap-4">
          {data.map((g, i) => (
            <Card key={i} title={`${g[0].name} · ${g.length} records`}>
              <div className="scroll-thin overflow-x-auto"><table className="w-full min-w-max text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-mute"><th className="py-2 pr-4">ID</th><th className="pr-4">Mobile</th><th className="pr-4">Email</th><th className="pr-4">Local PYPA</th><th className="pr-4">Centre</th><th /></tr></thead>
                <tbody>{g.map((m) => (
                  <tr key={m.id} className="border-t border-line"><td className="py-2.5 pr-4 font-mono text-xs"><Link className="link" href={`/portal/members/${m.id}`}>{m.id}</Link></td><td className="pr-4 font-mono text-xs">{m.mobile}</td><td className="pr-4">{m.email || "—"}</td><td className="pr-4">{m.local}</td><td className="pr-4">{m.centre}</td>
                    <td className="text-right">{m.canMark && <button className="btn btn-sm btn-bad" onClick={async () => { if (await ask("Mark as duplicate", `Mark ${m.name} (${m.id}) inactive as a duplicate? This can be undone by editing the member.`, "Mark inactive", true)) act("members.markDuplicate", { id: m.id }, "Marked inactive as Duplicate."); }}><Ban className="h-3.5 w-3.5" />Mark duplicate</button>}</td></tr>))}</tbody></table></div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
