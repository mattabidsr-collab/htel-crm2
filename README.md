# Heritage CRM

Heritage Telecom's (ACL Telecom LLC dba Heritage Telecom) operational system of record. See
[`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) for the full requirements and phased delivery plan.

This repository currently holds the **Stage 0 scaffold**: a modular-monolith foundation with
auth, database, jobs, storage, and one complete example module (Organizations), ready for
Stage 1 (Foundation) feature work.

## Stack

- **Framework:** Next.js (App Router, TypeScript) — one deployable app, server-rendered React
- **Database:** PostgreSQL via Prisma ORM, migrations checked into `prisma/migrations`
- **Jobs:** BullMQ on Redis (background sync/import workers land as each integration is built)
- **Object storage:** S3-compatible (MinIO locally) via the AWS SDK
- **Auth:** Auth.js (NextAuth v5), credentials provider with JWT sessions; SSO/MFA challenge
  flow is Stage 1 work — the `User` model already carries `role` and `mfaEnabled`
- **Validation:** Zod schemas at the API boundary
- **Logging:** Pino, with secret redaction
- **Testing:** Vitest

## Architecture

A single deployable app organized by domain module, not by technical layer:

```
src/
  app/                # Next.js routes, including /api/v1/* (versioned REST API)
  lib/                 # Cross-cutting infrastructure: db, auth, env, logger, queue, storage, audit
  modules/
    organizations/      # schema.ts (zod) + repository.ts (Prisma) + service.ts (business rules)
```

`modules/organizations` is the reference implementation for every future module (sites,
contacts, telecom inventory, contracts, billing, Vision tickets, etc.): a service layer that
enforces business rules (e.g. ACC-06 duplicate detection) and writes audit events, sitting on
top of a thin repository, consumed by a route handler that only handles auth/parsing/HTTP
concerns.

Every mutation is expected to call `recordAuditEvent` (`src/lib/audit.ts`) per requirement
ADM-03. Role checks use module-level permissions per the roles in spec section 3, via
`requireRole()` in `src/lib/api-auth.ts`.

## Local development

Requires Node 22+, pnpm, and either Docker or local Postgres/Redis/MinIO installs.

```bash
cp .env.example .env.local   # or .env
docker compose up -d          # postgres, redis, minio
pnpm install
pnpm db:migrate                # applies prisma/migrations
pnpm dev                       # http://localhost:3000
```

Other scripts:

```bash
pnpm lint        # eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
pnpm build        # production build
pnpm db:studio    # Prisma Studio
```

## What's scaffolded vs. what's next

Done in this scaffold:

- Repo/app structure, TypeScript config, lint/test/build tooling, CI workflow
- Prisma schema with baseline entities: `User`, `Organization`, `Site`, `Contact`,
  `ContactAffiliation`, `CallNote`, `AuditEvent` (UUID PKs, UTC timestamps, soft delete)
- Auth stub (credentials + JWT sessions, role on session, MFA field on `User`)
- Queue, storage, logger, and env-validation infrastructure
- One full vertical slice (Organizations: create + list) demonstrating the module pattern,
  including audit logging and duplicate detection

Not yet built (see `docs/BUILD_SPEC.md` section 14 for the staged delivery plan):

- Everything else in Stage 1 (roles/permissions UI, audit log viewer, global search, sites/
  contacts UI, MFA challenge flow)
- Telecom inventory, contracts/renewals, Vision ticket integration, billing reconciliation,
  email sync, dashboards, GoHighLevel sync (Stages 2–5)
