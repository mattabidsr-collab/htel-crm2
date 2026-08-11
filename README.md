# Heritage CRM

Heritage Telecom's (ACL Telecom LLC dba Heritage Telecom) operational system of record. See
[`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) for the full requirements and phased delivery plan.

This repository holds **Stage 0 (scaffold) + Stage 1 (Foundation) + Stage 2 (Telecom +
contracts)**: auth/roles/MFA, the audit log, navigation, organizations/sites/contacts, and now
telecom inventory, compliance, contracts, and renewal management.

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

Not yet built (see `docs/BUILD_SPEC.md` section 14 for the staged delivery plan):

- Vision ticket integration, billing reconciliation, email sync, dashboards, GoHighLevel sync
  (Stages 3–5)
- Record-level permissions (MVP uses module-level roles per spec section 3)
- Contact/site/service/DID edit and delete flows (create + list only so far)
