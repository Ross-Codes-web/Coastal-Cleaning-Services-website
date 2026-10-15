# Coastal Cleaning Services

A coastal cleaning business website that captures quote enquiries, offers a free printable cleaning checklist, and emails the owner when a new lead arrives.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `LEAD_NOTIFICATION_EMAIL` — owner inbox for new leads; `RESEND_FROM_EMAIL` — optional verified sender address for Resend
- Resend sender domains must be verified in Resend before notifications can be delivered to arbitrary recipients. The code has a test-sender fallback until a verified sender is configured.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/coastal-cleaning` — public website, quote form, and checklist page
- `artifacts/api-server/src/routes/leads.ts` — lead submission and email notifications
- `lib/db/src/schema/leads.ts` — saved quote and checklist requests
- `lib/api-spec/openapi.yaml` — source of truth for API contracts

## Architecture decisions

- Save each enquiry before attempting notification so requests are retained if email delivery fails.
- Use the Resend connector for email delivery; sender identity is environment-configurable and must be verified by the account owner.

## Product

- Visitors can request a cleaning quote or request the free coastal-home cleaning checklist.
- Quote requests collect name, phone, email, and service address; the site clarifies that a request is not a confirmed appointment and that replies are expected within 24 business hours.
- The owner is notified by email about both quote requests and checklist signups.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
