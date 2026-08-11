# Heritage CRM

Heritage Telecom's (ACL Telecom LLC dba Heritage Telecom) operational system of record. See
[`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) for the full requirements and phased delivery plan.

This repository holds **Stage 0 (scaffold) + Stage 1 (Foundation)**: auth/roles/MFA, the audit
log, navigation, and organizations/sites/contacts, on the modular-monolith foundation from
Stage 0.

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
- Global search across organizations, sites, and contacts (ADM-04)
- Home/My Work wired to real overdue and upcoming tasks (ADM-06), with quick task creation and
  completion from both the org workspace and the home page

Not yet built (see `docs/BUILD_SPEC.md` section 14 for the staged delivery plan):

- Telecom inventory, contracts/renewals, Vision ticket integration, billing reconciliation,
  email sync, dashboards, GoHighLevel sync (Stages 2–5)
- Record-level permissions (MVP uses module-level roles per spec section 3)
- Contact/site edit and delete flows (create + list only so far)
