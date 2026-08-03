# First Claude Code session — paste this as your opening message

> Read CLAUDE.md, DECISIONS.md, docs/architecture.md and docs/schema.md in this repo before doing anything.
>
> Session goal — Steps 1 & 2 only:
> 1. Scaffold the Next.js project (App Router, TypeScript), connect nothing to Vercel yet — just make it run locally.
> 2. Walk me through creating the Google Cloud service account and tell me exactly which env vars to set; create `.env.example`.
> 3. Before writing the data layer: here is my real database document [attach/paste it]. Reconcile docs/schema.md against it — list every difference and update schema.md to match reality, asking me where they conflict.
> 4. Build `lib/data.ts` per architecture.md (server-side only, club-scoped, cached, `submitAction()` with idempotency keys) plus the Apps Script files for the daily backup and the notification trigger, with instructions for me to install them.
> 5. Write `scripts/seed.md` and generate the sample data for both demo clubs.
>
> Do not start any section UI this session. If anything depends on an OPEN item in DECISIONS.md, stop and ask me.

## Before that session, spend five minutes on DECISIONS.md
Answer D1, D2, D7 and tick or override D3, D4, D6. D5 can wait until Workspace.
