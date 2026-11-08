"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRightLeft, Pencil } from "lucide-react";
import { TransferModal } from "@/components/portal/TransferModal";
import { Avatar, Banner, Card, KV, PageHeader, StatusPill } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import { fmtDate } from "@/lib/format";
import { ageOn } from "@/lib/util";
import type { Member } from "@/lib/types";

interface Res { member: Member & { pypaEnds: string }; canEdit: boolean; canTransfer: boolean; zone?: string; centre?: string; local?: string; pendingTransfer: { id: string; to: string } | null }

export default function MemberView() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error } = useRpc<Res>("members.get", { id });
  const [tr, setTr] = useState(false);
  if (error) return <Card><p className="text-bad">{(error as Error).message}</p></Card>;
  if (!r) return <div className="h-64 animate-pulse rounded-2xl bg-sunk" />;
  const m = r.member;
  const edu = ([["10th", m.tenth], ["12th", m.twelfth], ["Diploma", m.diploma], ["UG", m.ug], ["PG", m.pg], ["PG Diploma", m.pgd], ["PhD", m.phd]] as [string, string][]).filter(([, v]) => v);
  return (
    <>
      <PageHeader title={m.name} sub={`${m.id} · ${r.local}`} crumbs={[{ label: "Members", href: "/portal/members" }, { label: m.name }]}
        actions={<>{r.canTransfer && !r.pendingTransfer && <button className="btn" onClick={() => setTr(true)}><ArrowRightLeft className="h-4 w-4" />Transfer</button>}{r.canEdit && <Link href={`/portal/members/${m.id}/edit`} className="btn btn-pri"><Pencil className="h-4 w-4" />Edit</Link>}</>} />
      {r.pendingTransfer && <div className="mb-5"><Banner tone="warn">A transfer to <b>{r.pendingTransfer.to}</b> is waiting for State approval.</Banner></div>}
      {m.status === "Inactive" && <div className="mb-5"><Banner tone="bad">Inactive — {m.reason || "no reason recorded"}.</Banner></div>}
      <div className="grid gap-5">
        <Card><div className="flex flex-wrap items-center gap-5"><Avatar name={m.name} size={72} /><div><h2 className="font-display text-2xl font-semibold">{m.name}</h2><p className="mt-1 text-sm text-mute">{m.gender} · {ageOn(m.dob)} years · {m.blood || "blood group n/a"}</p><div className="mt-2 flex gap-2"><StatusPill s={m.status} /><span className="pill">Member from {m.from}</span></div></div></div></Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Personal"><KV items={[["Date of birth", fmtDate(m.dob)], ["Govt. ID", <span key="g" className="font-mono">{m.govId || "—"}</span>], ["Marital status", m.marital], ["Family", m.family || "—"], ["Father", m.father || "—"], ["Mother", m.mother || "—"], ["Mobile", m.mobile ? <span key="m" className="font-mono">{m.mobile}</span> : <span key="h" className="text-mute">Hidden for your role</span>], ["Email", m.email || "—"], ["Permanent address", m.perm || "—"], ["Communication address", m.comm || "—"]]} /></Card>
          <Card title="Church & PYPA"><KV items={[["Zone", r.zone || "—"], ["Centre", r.centre || "—"], ["Local PYPA", r.local || "—"], ["Saved on", fmtDate(m.saved)], ["Baptised on", fmtDate(m.baptism)], ["PYPA member from", m.from], ["PYPA membership ends", fmtDate(m.pypaEnds)], ["Fee paid years", m.paid.length ? m.paid.slice().sort().join(", ") : "None"]]} /></Card>
          <Card title="Qualification">{edu.length ? <KV items={edu} /> : <p className="text-sm text-mute">No qualification recorded.</p>}</Card>
          <Card title="Employment & residence"><KV items={[["Employment", m.employed], ...(m.occType ? [["Occupation", m.occType] as [string, string]] : []), ...(m.occOrg ? [["Organisation", m.occOrg] as [string, string]] : []), ["Residence", m.residence === "India" ? "India" : `Abroad — ${m.country}`]]} /></Card>
        </div>
      </div>
      <TransferModal open={tr} onClose={() => setTr(false)} memberId={m.id} memberName={m.name} fromLocal={m.local} />
    </>
  );
}
