# Heritage CRM

Heritage Telecom's (ACL Telecom LLC dba Heritage Telecom) operational system of record. See
[`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) for the full requirements and phased delivery plan.

This repository holds **Stage 0 (scaffold) + Stage 1 (Foundation) + Stage 2 (Telecom +
contracts) + call notes, SkySwitch CDR prefill, and Outlook email sync + Vision Helpdesk ticket
integration**: auth/roles/MFA, the audit log, navigation, organizations/sites/contacts, telecom
inventory/compliance/contracts, call logging, customer email synchronization, and a read-only
support-ticket projection with identity mapping.

## Stack

- **Framework:** Next.js (App Router, TypeScript) — one deployable app, server-rendered React
- **Database:** PostgreSQL via Prisma ORM, migrations checked into `prisma/migrations`
- **Jobs:** BullMQ on Redis (background sync/import workers land as each integration is built)
- **Object storage:** S3-compatible (MinIO locally) via the AWS SDK
- **Auth:** Auth.js (NextAuth v5), credentials provider with JWT sessions, TOTP MFA (required
  for administrators), route protection via `src/proxy.ts`
- **Validation:** Zod schemas at the API boundary
- **Logging:** Pino, with secret redaction
- **Testing:** Vitest

## Architecture

A single deployable app organized by domain module, not by technical layer:

```
src/
  app/                 # Next.js routes: pages + /api/v1/* (versioned REST API)
  proxy.ts             # Route protection: auth required, MFA enrollment gate for admins
  lib/                 # Cross-cutting infrastructure: db, auth, env, logger, queue, storage,
                        # audit, crypto, api-auth (role checks)
  modules/
    organizations/      # schema.ts (zod) + repository.ts (Prisma) + service.ts (business rules)
    sites/
    contacts/
    tasks/
    users/
    auth/               # MFA enrollment/verification
    audit/
    search/
    telecom/            # calc.ts (pure math) + metrics.ts (MRR/seat/DID) + compliance.ts (TEL-09)
    platform-accounts/
    services/
    dids/
    tendlc/             # 10DLC brands/campaigns
    ports/              # porting projects
    contracts/          # + renewal.ts (action deadline, alert task generation)
    call-notes/
    mailboxes/
    email/              # matching.ts (pure) + sync.ts + review.ts (association review queue)
    vision/             # sync.ts + mapping.ts (identity review queue) + metrics-calc.ts (pure)
  integrations/
    skyswitch/           # CDR client (HTTP + mock) + sync orchestration
    email/                # EmailProvider interface: Microsoft Graph (real) + mock
    vision/                # VisionClient interface: Vision Helpdesk HTTP client + mock
```

Each module follows the same pattern: a service layer that enforces business rules (e.g. ACC-06
duplicate detection) and writes audit events, on top of a thin Prisma repository, consumed by a
route handler that only handles auth/parsing/HTTP concerns.

Every mutation calls `recordAuditEvent` (`src/lib/audit.ts`) per requirement ADM-03. Role checks
use module-level permissions per the roles in spec section 3: `requireRole()` /
`requireUser()` (`src/lib/api-auth.ts`) for API routes, `requirePageRole()`
(`src/lib/require-page-role.ts`) for server-component pages.

## Local development

Requires Node 22+, pnpm, and either Docker or local Postgres/Redis/MinIO installs.

```bash
cp .env.example .env.local   # or .env — then set a real APP_ENCRYPTION_KEY (openssl rand -hex 32)
docker compose up -d          # postgres, redis, minio
pnpm install
pnpm db:migrate                # applies prisma/migrations
pnpm db:seed                   # creates an initial administrator (see prisma/seed.ts)
pnpm dev                       # http://localhost:3000
```

Sign in with the seeded administrator, then immediately enroll MFA — the app enforces this
before letting an administrator account do anything else (ADM-01).

SkySwitch, Microsoft Graph (Outlook), and Vision Helpdesk credentials are all optional — without
them, `/admin/integrations` and `/admin/mailboxes` run against mock adapters that generate
realistic data against real records already in the database, so the full sync/matching/review
pipeline works without any external account. See `.env.example` for the credential env vars.

Other scripts:

```bash
pnpm lint        # eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
pnpm build        # production build
pnpm db:studio    # Prisma Studio
```

## What's built vs. what's next

Stage 0 (scaffold):

- Repo/app structure, TypeScript config, lint/test/build tooling, CI workflow
- Prisma schema baseline, queue/storage/logger/env infrastructure

Stage 1 (Foundation), this pass:

- Auth: credentials login, TOTP MFA (enrollment + required-for-admin enforcement via `proxy.ts`),
  encrypted-at-rest MFA secrets (`src/lib/crypto.ts`)
- Admin user management: invite, role assignment, deactivate/reactivate without losing
  historical ownership (ADM-02), all audited
- Audit log viewer with entity/actor/date filters (ADM-03)
- Organizations, Sites, and Contacts modules (create + list), with ACC-06 duplicate detection
  on organization name and contact email
- Organization workspace with the section 8.2 tab structure — Overview/Sites/Contacts are live;
  Telecom/Contracts/Vision Tickets/Opportunities/Activity show what stage they land in
- Global search across organizations, sites, contacts, and now DIDs (ADM-04)
- Home/My Work wired to real overdue and upcoming tasks (ADM-06), with quick task creation and
  completion from both the org workspace and the home page

Stage 2 (Telecom + contracts), this pass:

- Platform accounts, services (with live MRR/seat/DID counts per business rules 1 and TEL-04),
  DIDs with SMS/E911/port status, 10DLC brands & campaigns, and porting projects
- TEL-09 compliance exceptions (active SMS without an approved 10DLC campaign; active DID with
  E911 still pending), surfaced on the Telecom tab
- Contracts with auto-computed action deadline (business rule 3) and auto-generated renewal
  alert tasks at 180/120/90/60/30 days out (CON-02); recording a renewal disposition requires a
  new end date and term when marked RENEWED (business rule 6)
- Renewals workspace (section 8.5) bucketing all contracts by action deadline
- Org header and Home/My Work now show real MRR and urgent renewals instead of placeholders

Documented simplifications from this pass:

- Contracts are scoped to one organization each (CON-03's multi-org/multi-site coverage is not
  modeled)
- No automated monthly MRR-snapshot job — the `MrrSnapshot` model and `captureMrrSnapshot()`
  exist, but nothing schedules it yet (no cron infra); CON-05 history is available on demand only
- Contract/port documents are schema fields (`documentKey`) only — no upload UI, since that needs
  the file-storage pipeline from ACT-04, which isn't built yet
- `ServiceType` stays an enum rather than an admin-configurable reference table, consistent with
  Stage 1's `OrganizationType`/`ContactRole` enums

Call notes, SkySwitch CDR prefill, and Outlook email sync, this pass:

- Call notes (ACT-11/12/13): manual create from the org workspace, next-action creates a
  linked Task, shown on the Activity tab
- SkySwitch CDR adapter (`src/integrations/skyswitch/`): OAuth2 client-credentials HTTP client
  (**endpoint schema unverified — this sandbox can't reach developers.skyswitch.com**) plus a
  deterministic mock client; the sync matches caller/callee numbers against the DID inventory
  and creates draft call notes flagged `needsReview` (a human still fills in the substantive
  note, per spec 5.7.6), idempotent via `externalCallId`
- Outlook email sync (section 5.6, ACT-06–15) via Microsoft Graph app-only auth (real adapter,
  standard/documented API — unlike SkySwitch this isn't a guess, but Heritage's actual Entra ID
  app registration is still unverified) plus a mock provider; HTML sanitized before storage
  (ACT-14, strips scripts/tracking pixels), attachment metadata only — no bytes copied (ACT-15),
  idempotent via `providerMessageId`
- Participant matching (ACT-07): exact contact-email match only; conflicting/unmatched senders
  land in the `/admin/email-review` queue rather than being guessed, with manual
  associate/exclude actions (ACT-10), all audited
- Exclusion rules (ACT-09): internal-domain and common automated-sender patterns
  (`noreply@`, etc.) auto-excluded from customer timelines
- `/admin/integrations` shows live-vs-mock status per integration and triggers syncs on demand
  (still no cron infra)

Verified live in this pass: the full mock-provider pipeline end-to-end (CDR matching → draft
call note → review completion; email ingestion → sanitization → matching/exclusion/ambiguous
routing → manual association), including idempotency on repeated syncs. Not verified: the real
SkySwitch and Microsoft Graph HTTP calls themselves — no live credentials were available.

Vision Helpdesk ticket integration, this pass:

- Read-only ticket projection (SUP-01): `VisionTicketProjection` mirrors ticket id, subject,
  status, priority, category, and timestamps from Vision; the org workspace's Vision Tickets tab
  and the Home page's open-tickets list both read from this projection, never from Vision live —
  Vision itself stays the authoritative system for ticket workflow (business rule 8), and there
  are intentionally no reply/assign/status-change controls in this app (SUP-09)
- Identity mapping + review queue (SUP-03/06/07): Vision's `externalCustomerId` doesn't line up
  with our organization IDs, so `VisionIdentityMapping` tracks each external customer as
  MAPPED/UNMAPPED/IGNORED; `/admin/vision-review` lists unmapped identities for an admin to map to
  an organization or ignore. Mapping an identity backfills `organizationId` on every already-synced
  ticket for that customer in one transaction, so tickets synced before mapping existed still show
  up correctly afterward instead of being silently orphaned
- Support metrics (SUP-08): open count, tickets in the last 90 days, oldest-open-ticket age, and
  repeat-issue categories, computed by a pure `summarizeTickets()` function (unit tested) and
  shown on the Vision Tickets tab
- Global search now includes Vision tickets by ticket ID or subject (ADM-04)
- `/admin/integrations` shows live-vs-mock status for Vision alongside SkySwitch and Microsoft
  Graph, with a manual sync trigger (still no cron infra)

Vision's real API shape came from the user's own live system access, not public docs (this
sandbox's egress proxy blocks `visionhelpdesk.com` and its subdomains) — confirmed details:
tickets are addressed by **two** IDs, a mask (e.g. `QBZC-364991`) and a numeric ID (e.g. `78077`),
both captured on the projection; requests are `GET` with query-string params against
`/api/index.php`, using a `vis_module`/`vis_operation` convention (confirmed for
`ticket_details`), `vis_encode=json`, and auth via either `vis_txttoken` or
`vis_txtusername`/MD5-hashed `vis_txtuserpass`. Unconfirmed: the bulk/recent-tickets operation
name used by `fetchRecentTickets()` (`get_tickets`) — only single-ticket lookup was confirmed in
the doc excerpt provided, so this is a documented guess pending the real API reference.

Not yet built (see `docs/BUILD_SPEC.md` section 14 for the staged delivery plan):

- Billing reconciliation, dashboards, GoHighLevel sync (Stages 4–5)
- Record-level permissions (MVP uses module-level roles per spec section 3)
- Contact/site/service/DID/call-note/email edit and delete flows
- Global quick-create for call notes (ACT-13 mentions this alongside the account-workspace
  path, which is built); OAuth consent-flow UI for connecting a real Outlook mailbox (mailboxes
  are registered directly today, not through an interactive Microsoft consent screen)
