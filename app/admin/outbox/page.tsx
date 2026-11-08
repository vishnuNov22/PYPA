"use client";
import { useState } from "react";
import { MailPreview } from "@/components/MailPreview";
import { Card, Empty, PageHeader } from "@/components/ui/kit";
import { useRpc } from "@/lib/client";
import { fmtDT } from "@/lib/format";
import type { Mail } from "@/lib/types";

export default function Outbox() {
  const { data } = useRpc<{ mail: Mail[]; sms: { id: string; to: string[]; text: string; date: string }[] }>("outbox.list");
  const [open, setOpen] = useState<Mail | null>(null);
  return (
    <>
      <PageHeader title="Email & SMS log" sub="Every email the portal has sent (welcome mails, password resets, notices) and SMS alerts. When SMTP is not configured, mails are only logged here." />
      <div className="grid gap-5">
        <Card title={`Emails (${data?.mail.length ?? 0})`} pad={false}>
          {data && data.mail.length === 0 ? <Empty>No emails yet.</Empty> : (
            <ul className="divide-y divide-line">{(data?.mail || []).map((m) => <li key={m.id}><button className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-left hover:bg-sunk/60" onClick={() => setOpen(m)}><span className="min-w-0"><b className="block truncate">{m.subject}</b><span className="text-sm text-mute">{m.to}</span></span><span className="text-xs text-mute">{fmtDT(m.date)}</span></button></li>)}</ul>)}
        </Card>
        <Card title={`SMS (${data?.sms.length ?? 0})`} pad={false}>
          {data && data.sms.length === 0 ? <Empty>No SMS sent. SMS delivery is a stub until a gateway is connected.</Empty> : (
            <ul className="divide-y divide-line">{(data?.sms || []).map((s) => <li key={s.id} className="px-5 py-3.5 text-sm"><div className="flex justify-between gap-3"><b>{s.to.length} recipient{s.to.length > 1 ? "s" : ""}</b><span className="text-xs text-mute">{fmtDT(s.date)}</span></div><p className="text-mute">{s.text}</p></li>)}</ul>)}
        </Card>
      </div>
      <MailPreview mail={open} onClose={() => setOpen(null)} title={open?.subject || "Email"} />
    </>
  );
}
