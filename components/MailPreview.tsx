"use client";
import { Mail } from "lucide-react";
import { Modal } from "./ui/Modal";
import type { Mail as M } from "@/lib/types";

/** Shown only when SMTP is not configured, so the email contents can be checked during testing. */
export function MailPreview({ mail, onClose, title = "Email sent" }: { mail: M | null | undefined; onClose: () => void; title?: string }) {
  return (
    <Modal open={!!mail} onClose={onClose} title={title} size="lg" footer={<button className="btn btn-pri" onClick={onClose}>Done</button>}>
      {mail && (
        <div className="grid gap-4">
          <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">SMTP is not configured on this server, so no real email was sent. This is a preview of the message. Set <code className="font-mono">SMTP_HOST</code> in <code className="font-mono">.env.local</code> to send real emails.</p>
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line bg-sunk px-4 py-3 text-sm"><span><Mail className="mr-1.5 inline h-4 w-4" /><b>To:</b> {mail.to}</span><span><b>Subject:</b> {mail.subject}</span></div>
            <pre className="whitespace-pre-wrap break-words px-4 py-4 font-sans text-sm leading-relaxed">{mail.body}</pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
