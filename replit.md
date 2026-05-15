# FunScript Hub

A web app for Content Creators to manage and share FunScripts with their subscribers via trackable URLs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/funscript-hub run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Recharts

## Where things live

- DB schema: `lib/db/src/schema/` — creators, funscripts, access_logs
- API spec: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- API routes: `artifacts/api-server/src/routes/` — creators, scripts, access, stats
- Frontend pages: `artifacts/funscript-hub/src/pages/`

## Architecture decisions

- Share tokens are random 16-char hex strings generated at script creation time
- Access tracking happens server-side on `GET /api/s/:token` — no client-side JS required
- `serializeDates()` helper converts Drizzle Date objects to ISO strings before Zod parsing
- Creators have no auth yet — identified by handle; auth will be added later
- `viewCount` is stored denormalized on the funscripts row and incremented on each access

## Product

- **Dashboard**: Live overview of total views, today's activity, top scripts by views, recent access feed
- **Creators**: Create and manage creator profiles (name, handle, bio)
- **FunScripts**: Create scripts with title, description, content URL; each gets a unique share URL
- **Share URLs**: `/s/:token` — public page for subscribers; tracks every visit automatically
- **Analytics**: Per-script daily views chart (last 30 days), access log table with IP/agent/referrer

## User preferences

- No authentication in initial version; will be added later
- No expiry limits on FunScripts in initial version (field exists for future use)

## Gotchas

- Always run `pnpm run typecheck:libs` after changing DB schema to rebuild declarations before typechecking server
- Date fields from Drizzle come as JS Date objects; wrap in `serializeDates()` before Zod.parse()
- After each OpenAPI spec change: run codegen, then rebuild libs

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
