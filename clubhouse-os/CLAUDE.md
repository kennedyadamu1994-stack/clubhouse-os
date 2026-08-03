# CLUB HOUSE OS — CLAUDE.md (non-negotiables)

Club House OS is a personalised dashboard for grassroots sports clubs, one per club, all reading from a shared Google Sheets master database via `/dashboard/[clubToken]`. Full context lives in `/docs` — read the relevant file before starting any section:

- `docs/architecture.md` — stack, auth, data layer, token ledger, notifications, failure behaviour
- `docs/schema.md` — column-level database schema (⚠️ reconcile with Kennedy's real database before Step 2)
- `docs/components.md` — shared components built before any section
- `docs/sections/01–05` — one spec per section
- `DECISIONS.md` — decisions Kennedy has made or must make. **If a build step depends on an OPEN decision, stop and ask. Never pick a default.**

## Rules that apply to every session

1. **Nothing is generic.** Every panel, list, and recommendation is filtered and scored against the current club's row. No club can ever see another club's data — enforce scoping server-side (see architecture.md § Auth), never in the client.
2. **Build sequentially.** One section to full completion (Definition of Done below) before the next starts. All five sections are in scope; "later" means "next," never "cut."
3. **GDPR rule for Outreach data:** expansion views show interests, availability, preferred times — **never names, addresses, emails, or phone numbers without a consent flag on that row.**
4. **No dead ends.** Every screen, including a brand-new club with no data, has a designed empty state naming what's missing with a direct call to action. Never a blank panel.
5. **No token spent uninformed.** Token cost on the button; balance always visible in the same place; first encounter shows a one-off explainer.
6. **Black button** = club self-serves (usually external link), free. **Pink button** = Kennedy acts on the club's behalf, costs tokens, **always fires a notification** (architecture.md § Notifications).
7. **Tokens are ledger-based.** Never edit a balance cell in place — append to `Actions_Log` with an idempotency key; balance is computed from the ledger (architecture.md § Token ledger).
8. **Accessible the first time.** WCAG AA per component as built: contrast checked (especially pink `#FF1B6E` on dark), keyboard navigation, ARIA labels. Modals become full-screen sheets on mobile.
9. **Kennedy's admin surface is the Sheet itself** during the pilot. Do not build an admin panel. `docs/architecture.md` lists which tabs/columns he edits by hand.
10. **Data survives mistakes.** Caching from day one; daily automated snapshot; failure behaviour per architecture.md § Failure — never a raw crash on a Sheets API error.

## Design tokens (match the existing demo exactly)

Dark `#1B1B1B` background · hot pink `#FF1B6E` accent · Young Serif headings · DM Sans body · 4px radius. If pink-on-dark fails WCAG AA for readable text, adjust the shade for text only and record it in DECISIONS.md.

## Stack

Next.js on Vercel, GitHub repo `clubhouse-os`, Google Sheets API via service account (credentials in Vercel env vars, never committed), Google Apps Script for notifications and backups. One server-side data-access layer that everything calls through, with caching built in.

## Definition of Done (end of every section, before the next)

- [ ] Wired to live Sheets data — no mock content
- [ ] Every action tested end-to-end per `docs/qa/` checklist: click → ledger row appended → confirmation shown → Kennedy notified where relevant → no double-deduction on retry
- [ ] Empty state built and reviewed against demo club B (pre-triage)
- [ ] Mobile checked: bottom tab bar nav, full-screen action sheets — not just responsive shrinking
- [ ] Accessibility pass: contrast, keyboard, screen reader
- [ ] Demoed to at least one real pilot club
