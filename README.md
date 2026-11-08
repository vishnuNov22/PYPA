# PYPA Kerala State — Website & Portal

A Next.js 14 (App Router, TypeScript, Tailwind) build of the PYPA Kerala State website and the
State / Zone / Centre / Local portal, following the *PYPA Portal V1.1* specification.

* **Public site:** Home, About / History, Ongoing Projects, Leadership & Contact, Wall,
  Yuvajana Kahalam (PDF reader), Job Portal. English and Malayalam, light and dark mode.
* **One login for everyone:** username = email. Forgot password sends an email link.
  Forgot username explains who to contact at State. First sign-in with a temporary password forces a change.
* **Portal Administrator:** user management (change username, reset password), master data
  (member ID format, yearly fee, Country / State / City / Blood Group lists) and content management
  for every public page (including Kahalam PDF and Wall image uploads, job approvals).
* **State, Zone, Centre and Local portals:** pie-chart dashboard and notification bell, unit view/edit,
  unit lists (50 per page, sorting, filters, search, Excel/CSV export), members, dues calculation and payment
  (online QR / offline, State approve/reject with remarks), member transfers (Local starts, State approves),
  duplicate member page, council members (current / past), letters (attachments for State only, SMS tick-box,
  clear files older than a year), activity logs, talent test.
* **State Admin Panel:** edit freeze, member age-over (31 Dec, over 40), monthly duplicate check, talent-test
  parameters, reset username / password.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# production:
npm run build && npm start
```

Needs Node 18.17 or newer (tested on Node 22). The first start creates `data/db.json` with demo data.
Delete `data/` to reset to the demo data.

### Demo accounts

All demo accounts use the password **`pypa@123`**. The login page lists them as one-tap buttons
(hide them with `PYPA_DEMO=off`).

| Role | Username |
|---|---|
| Portal Administrator | `admin@pypakerala.example` |
| State | `state@pypakerala.example` |
| Zone | `zone.tvm@pypakerala.example` |
| Centre | `centre.nedumangad@pypakerala.example` |
| Local PYPA | `local.salem.nedumangad@pypakerala.example` |

## Configuration

Copy `.env.example` to `.env.local`. Every variable is optional for a demo.
The important ones for a real deployment:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs login cookies and reset links. **Set a long random value.** |
| `APP_URL` | Public site address, used in email links. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Real email. Without `SMTP_HOST` nothing is sent: emails appear in **Admin → Email log** and as an on-screen preview. |
| `NEXT_PUBLIC_UPI_ID` | UPI id inside the dues QR code (placeholder by default). |
| `MAX_ATTACH_MB` | Largest letter attachment (default 2). |
| `CRON_SECRET` | Lets an external scheduler call `/api/cron/duplicates` and `/api/cron/age-over` with `Authorization: Bearer …`. |
| `PYPA_AUTO_JOBS=off` | Turns off the built-in lazy monthly / yearly jobs if you use cron instead. |

## How it is built

```
app/(public)/…        public pages (server components, content from the data store)
app/portal/…          State / Zone / Centre / Local portal
app/admin/…           Portal Administrator
app/api/rpc           one endpoint: POST {action, input} → handlers in lib/handlers/*
app/api/upload        letter attachments (State only, PDF/JPG, size limit) and public uploads (admin only)
app/api/files/…       serves uploads (letter files need a signed-in session)
lib/domain.ts         scope rules, freeze guard, notifications, dues maths, duplicate and age-over jobs
lib/handlers/*        one file per feature area; every permission check lives here, on the server
lib/db.ts             data store
components/…          UI kit, data table, charts, portal shell
```

Permissions are enforced on the server for every action: a zone cannot read another zone's members,
Zone/Centre never receive member mobile numbers, an active edit freeze blocks every non-State write
(HTTP 423), only State can approve dues, transfers and new locals, and so on.

## Before you go live

* **Data store.** Data is kept in `data/db.json` (in memory, written through to disk). That is fine for a
  demo or a single small server, but not for production. `lib/db.ts` is the only file that touches storage:
  replace it with Postgres / Prisma (the types are in `lib/types.ts`). Uploaded files live in `data/uploads`;
  move them to object storage (S3 etc.) for a hosted deployment.
* **Sample content.** The members, units and councils are generated demo data. The About / History text,
  mission and vision, office address, phone, email and social links are placeholders to be replaced from
  **Admin → Content management**. The Yuvajana Kahalam issues show sample pages until you upload a PDF.
* **Email** is not delivered until SMTP is configured. **SMS** is a stub that only records the message
  (Admin → Email log); connect a gateway in `lib/mail.ts` (`sendSms`).
* **Payments.** The dues QR uses the placeholder UPI id above. Payment is verified by State from the
  transaction reference; there is no payment-gateway integration.
* Set `SESSION_SECRET`, serve over https, and put a rate limiter in front of `/api/rpc` login actions.


## UI design notes

Palette: white surfaces, deep teal `#142e37` and emerald `#237b68`, with mint accents. Colours are CSS tokens in `app/globals.css` (light and dark), so the whole theme can be changed in one place.

Interactive features: animated KPI counters and charts, collapsible sidebar with a sliding active pill, Ctrl/Cmd+K command palette, row quick-look drawers on member and unit lists, a step-by-step member form with validation per step and a review screen, a 3-step dues payment flow with an animated success screen, and on the public site a cursor-spotlight hero, scroll progress bar, tilt cards and a Zone Explorer fed from the live register. Animations respect `prefers-reduced-motion`.
