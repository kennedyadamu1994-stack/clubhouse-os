# DECISIONS.md — answer before the build starts

Each item is either **OPEN** (Kennedy must answer — Claude Code stops if a step depends on it) or **PROPOSED** (a concrete v1 is specified in the docs; Kennedy ticks to approve or writes an override). Change a status to **DECIDED** with the answer and date.

---

## Blockers — answer these before Step 1

### D1. Token refill & expiry rules — **OPEN**
Blocks: token system going live; `Actions_Log` and `Clubs` schema fields.
Pick one per question:
- Refill: (a) reset to full allocation monthly · (b) roll over indefinitely · (c) roll over with a cap of ___ tokens
- At zero: (a) pink buttons disabled until refresh · (b) request can be queued and actioned after refresh
- Answer: ________________

### D2. Notification channel for pink-button actions — **OPEN**
Blocks: Step 4 (token/notification backbone).
- (a) Email via Apps Script to ___________ · (b) Slack webhook to #________ · (c) both
- Answer: ________________

### D3. Auth model — **PROPOSED** (see architecture.md § Auth)
v1 proposal: unguessable club token in the URL (magic link), all data scoped server-side, links revocable/rotatable from the Clubs sheet. No passwords during pilot.
- [ ] Approve v1 · Override: ________________

### D4. Match-score formula v1 — **PROPOSED** (see architecture.md § Scoring)
Weighted tag overlap, weights editable in the `Config` sheet, normalised 0–100.
- [ ] Approve v1 weights · Override: ________________

---

## Needed before their section starts

### D5. Copy Generator delivery model — **OPEN** (blocks Workspace → Copy Generator only)
- (a) Rebuild as standalone tool on its own API key/billing · (b) requestable service costing tokens (spec leans this way near-term)
- Answer: ________________
- Status note (4 Aug): Workspace shipped with everything except this — Insights, Opportunities, Resources, and FAQ are all live. Copy Generator is a designed "coming soon" tile per the spec's permitted deferral, not scaffolded. Answering this unblocks that one page only.

### D6. Calendar data source — **PROPOSED** (blocks Tools → Calendar)
v1: read-only calendar rendered from `Opportunities` rows that carry a date, plus an `Events` tab Kennedy maintains by hand.
- [ ] Approve · Override: ________________
- Status note (4 Aug): built as proposed — PROPOSED items are safe to build as v1 unless overridden, unlike OPEN ones which block. `Events` tab added to seed data (`data/events.json`); Kennedy maintains it by hand once on the real sheet, same as the spec describes. Tick this once you've seen it live, or override if you want something different.

### D7. Sheets → dedicated DB migration trigger — **OPEN** (record in README; no build work yet)
First threshold crossed wins: ___ total DB entries · ___ active clubs · dashboard load > ___ s
- Answer: ________________

---

## Deferred (do not build; keep visible)

- **D8.** Token allocation per Core/Premium tier — set from pilot usage data. Never hardcode; read from `Config`.
- **D9.** Core/Premium split by feature access instead of tokens — parked entirely.
- **D10.** Club triage/audit tool — build after Workspace → Insights (scoped in sections/03-workspace.md). Until then, all clubs use the pre-triage empty state.


---

## Design decisions (decided by Kennedy, 3 Aug 2026)

- **D11 — DECIDED:** Text on solid pink backgrounds is always white. Kennedy accepts the ~3.7:1 contrast (below AA 4.5:1 for normal text); if a pilot club flags readability, the remedy is deepening the button pink, not switching to dark text.
- **D12 — DECIDED:** The entry detail toggle is a white italic "i" in a soft black box — never an eye icon/emoji.
