"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Card, Empty, PageHeader } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { ago } from "@/lib/format";

interface N { id: string; title: string; body: string; date: string; read: boolean; go?: string }

export default function Notifications() {
  const router = useRouter();
  const { data } = useRpc<N[]>("notif.list");
  const unread = (data || []).filter((n) => !n.read).length;
  return (
    <>
      <PageHeader title="Notifications" sub={unread ? `${unread} unread` : "You’re all caught up."} actions={unread ? <button className="btn" onClick={() => act("notif.read", {}, "All marked as read.")}><CheckCheck className="h-4 w-4" />Mark all read</button> : undefined} />
      <Card pad={false}>
        {!data ? <div className="m-5 h-40 animate-pulse rounded-xl bg-sunk" /> : data.length === 0 ? <Empty icon={<Bell className="h-8 w-8" />}>No notifications yet.</Empty> : (
          <ul className="divide-y divide-line">{data.map((n) => (
            <li key={n.id}><button className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-sunk/60" onClick={async () => { if (!n.read) await act("notif.read", { id: n.id }); if (n.go) router.push(n.go); }}>
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} />
              <span className="min-w-0 flex-1"><b className={n.read ? "font-semibold" : ""}>{n.title}</b><span className="mt-0.5 block text-sm text-mute">{n.body}</span></span>
              <span className="shrink-0 text-xs text-mute">{ago(n.date)}</span></button></li>))}</ul>
        )}
      </Card>
    </>
  );
}
void Link;
