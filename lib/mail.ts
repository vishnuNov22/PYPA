import { db, save } from "./db";
import { uid } from "./util";
import type { Mail } from "./types";

/**
 * Email: if SMTP_HOST is set the message is sent through it (nodemailer).
 * Without SMTP it is only written to the outbox (visible in Admin > Email log).
 */
export function smtpConfigured() { return !!process.env.SMTP_HOST; }

export function sendMail(to: string, subject: string, body: string): Mail {
  const m: Mail = { id: uid("m"), to, subject, body, date: new Date().toISOString() };
  const d = db();
  d.outbox.unshift(m);
  if (d.outbox.length > 300) d.outbox.length = 300;
  save();
  if (smtpConfigured()) {
    import("nodemailer").then(({ default: nm }) => {
      const t = nm.createTransport({
        host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      return t.sendMail({ from: process.env.MAIL_FROM || "PYPA Kerala <no-reply@pypakerala.example>", to, subject, text: body });
    }).catch((e) => console.error("Mail failed:", e));
  } else {
    console.log(`[mail:dev] to=${to} subject=${subject}`);
  }
  return m;
}
/** SMS gateway placeholder. Plug in MSG91 / Twilio / any provider here. */
export function sendSms(to: string[], text: string) {
  const d = db();
  d.sms.unshift({ id: uid("s"), to, text, date: new Date().toISOString() });
  if (d.sms.length > 300) d.sms.length = 300;
  save();
}
