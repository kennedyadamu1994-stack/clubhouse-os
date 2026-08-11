# Club House OS

Personalised dashboards for grassroots clubs, on top of The NBRH master database.
Governed by `CLAUDE.md` + `/docs` + `DECISIONS.md` — read those first.

## Status
- ✅ **Overview** — built, tested. Six shortcut tiles removed. Every card
  genuinely expands/collapses at every screen size (desktop included).
- ✅ **Outreach** — all six subsections: search + filter + **sort** (best
  match / name A–Z / closing-soonest where relevant), a compact square
  match-score badge on every colour-scale (red→yellow→green), real images
  with an initials placeholder fallback, and entry cards that
  expand/collapse at every screen size via their header row. Rows are the
  redesigned version (real padding, 3-column grid) — see changelog below.
- ✅ **Splash pages** — a general welcome screen at `/`, and a personalised
  one per club at `/dashboard/[clubToken]/welcome` using that club's own
  header photo, name, sport, and area. The old pilot club-picker lives at
  `/directory` now, not `/`.
- ✅ **Workspace** — Insights (club-specific comparison + a platform-wide
  session-data block below it), Opportunities (incl. club-submitted
  call-outs), Resources, FAQ all live. Copy Generator is a designed
  "coming soon" tile — DECISIONS.md D5 is still **OPEN** and blocks it.
- ✅ **Tools** — Contact Us (its own modal with a type selector), Search
  (the real NBRH Engine, ported — replaces the old Find link-out now that
  the actual source was provided), Map (the NBRH interactive Leaflet map,
  ported), Calendar (fixed-height month grid desktop / agenda list
  mobile, click any event for a detail popup with an external link, from
  Events + dated Opportunities).
- ⚠️ Brands & Businesses / Influencers still have no dedicated tab in the
  real database — flagged visibly on both pages, seed data only.
- ⏳ Services — the last section in the build sequence

## Important: what actually reached this repo, session to session
Two earlier sessions built the entry-row redesign, both splash pages, and
a first version of Workspace, and packaged each as a zip — but re-cloning
this repo fresh at the start of the Workspace-plus-Insights session showed
only the entry-row redesign and splash pages had actually landed; that
session's Workspace zip hadn't been uploaded yet. Re-cloning fresh again
at the start of THIS session (Tools), everything from that
session — Workspace, session-insights.tsx, all of it — was confirmed
present. Worth this check at the start of every session regardless: if a
future session finds gaps between this README and the live site, verify
the most recent zip was actually uploaded before assuming a build step was
skipped.

## Run it (GitHub → Vercel only, no local terminal needed)
Unzip — **no wrapping folder** — drag everything onto your repo's file
list, commit, wait ~2 minutes for Vercel.

The links you hand to clubs should point at `/welcome`, not the bare
dashboard URL — that's the splash screen; its own button sends them into
the real dashboard.

Demo dashboards (unguessable tokens — rotate before real use):
- **Populated club:** `/dashboard/hkfc-x7Kq2mZ9pR4wT8vN3sJ6/welcome`
- **Brand-new club:** `/dashboard/newc-b3Fh8nQ5tW2yL7xD4gV9/welcome`

## What's built (cumulative)
- Next.js app, club-token routing, server-side club scoping, invalid token → 404
- Data-access layer (`lib/data`) — local adapter active, Sheets adapter scaffolded
- Ledger-based token system with idempotency keys
- Match scoring (`lib/scoring.ts`) + colour scale (`lib/match-colour.ts`),
  verified against real hex output, not assumed correct from HSL numbers alone
- Shared Entry Card, Action Pop-up, Search/Filter/Sort Bar, Outreach List,
  Collapsible Card — all genuinely collapsible at every screen size,
  keyboard-navigable, ARIA-labelled, AA-contrast text throughout
- Overview + Outreach (all 6 subsections) + Priorities capture form
- General and per-club splash/welcome pages
- Workspace: Insights (club comparison + platform-wide session data),
  Opportunities (incl. club-submitted call-outs via `ListCalloutButton`),
  Resources (library + category filter), FAQ (searchable accordion),
  Copy Generator (deferred tile, D5 open)
- Tools: Contact Us (`ContactUsForm` — its own modal, type selector, reuses
  the `contact_us` ledger action), Search (`NbrhEngine` — the real NBRH
  Engine, ported), Map (`NbrhMap` — the real NBRH Leaflet map, ported),
  Calendar (`CalendarView` — fixed-height month grid desktop / agenda list
  mobile, click-to-detail popup, from `Events` + dated `Opportunities`)
- Apps Script files for daily backup + pink-button notifications (`/apps-script`)

## Next (in order)
1. Confirm with Kennedy: real tab for Brands & Businesses / Influencers, or fold into Clubs?
2. Answer DECISIONS.md D1/D2/D5/D7; create the Google service account
3. Implement `lib/data/sheets.ts` against the real spreadsheet — now also
   needs `getResources()`/`getFaq()`/`getEvents()`/`getPeerCompletenessScores()`,
   see that file's own notes. (The platform-wide data behind Insights,
   Search, and Map is deliberately NOT part of this — see each
   component's own top-of-file note on why.)
4. Build Services — the last section in the build sequence
5. Once D5 lands, build Copy Generator for real
6. Overview's own spec calls for an area-only "neighbourhood ranking" that
   isn't built yet — don't confuse this with Workspace → Insights' sport+area
   comparison table, which is a separate, already-built thing
   (`lib/scoring.ts` → `peerComparison()`)
7. A real universal search bar and a header "help" icon linking to FAQ are
   both called for in the original Overview spec but were never built —
   don't confuse this with Tools → Search (the NBRH Engine catalogue
   search added this session), which is a different thing entirely
8. Tools → Map calls a Google Apps Script web app URL — a different kind
   of external dependency from the `opensheet.elk.sh` endpoint everything
   else uses. If Map stops returning data while Search/Insights still
   work, check that Apps Script deployment specifically before assuming
   a platform-wide outage

## Changelog

### This session: search cards' mobile fix used the wrong breakpoint
Kennedy sent a screenshot: on a phone, the search card was stretched
vertically but a big black gap sat to its right instead of the card
filling the row — the "make search cards full-width on mobile" fix from
last session hadn't actually taken effect at the width shown.

- **Root cause: two different, disconnected breakpoints for "mobile."**
  The app's real mobile mode — where the sidebar hides and the whole
  shell goes single-column (`.shell { flex-direction: column }`,
  `.sidebar { display: none }`) — switches at `780px`. Last session's
  search-card fix was added at `599px` instead, because that number
  happened to already exist in the file for an unrelated reason (the
  list-view card's own responsive tweak). Between 599px and 780px, the
  shell was already single-column with no sidebar, but the search cards
  were still sitting at their old fixed 280px width — that gap is exactly
  the black space in the screenshot. Confirmed this by reading the
  compiled CSS's actual media-query boundaries, not by guessing from the
  source file alone.
- **Fix:** moved the full-width override into the app's real 780px
  mobile-mode block, right alongside the other rules that already switch
  the layout over at that width, instead of leaving it in a disconnected
  breakpoint that didn't correspond to anything else in the app.
- Verified by locating the exact compiled rule and walking backward to
  confirm which `@media` block actually wraps it (780px, correctly), and
  confirmed the old 599px block no longer contains it — not just that a
  fix was present somewhere in the file, but that it's in the specific
  block that governs when this app considers itself "mobile."

### Previous session: twelve UI/UX polish requests
A batch of smaller edits across the whole app, not one feature — sequenced
low-risk-first, each checked against a real server before moving to the
next.

- **Token bar moved to Overview only.** It used to render in the shared
  dashboard `layout.tsx`, which wraps every page — moving it meant adding
  a small client component (`TokenWidget` in `components/greeting.tsx`)
  that checks the route via `usePathname()` (same pattern `PageTitle`
  already used) and renders nothing unless the path is exactly
  `/dashboard/[clubToken]` with no further segments. The actual token data
  is still fetched server-side in the layout — the component just decides
  whether to show the markup it's handed, so there's no extra fetch and
  no server/client mismatch.
- **Found and fixed a real, previously-silent bug while doing the
  "section titles should match" request:** the header's `PageTitle`
  lookup table only had entries for Outreach's six subsections — every
  Workspace and Tools page (Insights, Opportunities, Resources, FAQ,
  Copy Generator, Contact Us, Search, Map, Calendar) was silently
  showing "Overview" as its own page title the whole time. Extended the
  lookup table; confirmed all nine previously-wrong pages now show their
  correct title.
- **Profile completeness now matches the KPI card's height** — the
  `.grid` on Overview had `align-items: start`, so each card sized to
  its own content independently; changed to `align-items: stretch` (the
  grid default), so both cards in a row now take the taller sibling's
  height.
- **KPI cards restyled to match the reference file's "Performance"
  section** — accent top border, serif-styled name, card grid — but
  without a fabricated target/current/progress bar. `club.kpis` is a
  plain list of goal names, not numeric metrics with real targets;
  inventing numbers to fill the reference's shape would be actively
  misleading, so the new `.kpi-card` shows the goal name with an honest
  "Tracking" label instead of a status pill it has no real data to back.
  Asked first whether this should also mean adding a brand-new Schedule
  section to Overview (the reference's calendar is a genuinely different
  thing — a delivery/deadline tracker — from this app's own Tools →
  Calendar, which shows external NBRH events) — confirmed: visual
  restyle only, no new section.
- **Icons added**: `lucide-react` installed as a real dependency. Home
  icon on Overview, and a fitting icon on each other top-level section
  (Outreach/Workspace/Tools/Services) — in both the sidebar and the
  mobile tab bar. Scoped to the five top-level section labels, not every
  individual sub-link, to match "tab section" language without adding
  visual noise to twenty+ sub-items.
- **Sub-page tabs made bigger** (`.chip` — the Players/People/Insights/
  Search/etc. row on every Outreach/Workspace/Tools page) — bigger
  padding, font-size, and touch target.
- **Mobile bottom tab bar made bigger** — more padding, larger text and
  dots. Also bumped `.main`'s bottom padding on mobile so page content
  doesn't end up hidden behind the now-taller fixed bar.
- **Search cards go full-width on mobile** — previously fixed at 280px
  regardless of viewport, which either left dead space or forced
  horizontal scrolling on a phone; added a mobile override so the
  default carousel view (not just the list view, which already had one)
  goes single-column full-width below 599px.
- **Workspace → Insights is now collapsible** — swapped its plain `<div
  className="card">` wrapper for the existing `CollapsibleCard`
  component (the same one Overview's cards already use), rather than
  building a second collapsible pattern.
- **Two-line cap added in two places** where long real text could
  otherwise wrap indefinitely and break a layout's rhythm: sidebar
  sub-links (e.g. "Sponsorship & Funding," "Brands & Businesses" wrapping
  to 3+ lines in a narrow sidebar) and Outreach entry-row titles (a long
  real name could grow a fixed-height row grid unevenly).
- **Contrast increased between the dark background and card surfaces** —
  measured the actual WCAG contrast ratios first (`--bg` vs `--surface`
  was 1.08:1, barely distinguishable) rather than eyeballing a fix;
  widened `--surface`/`--surface-2`/`--sunken` to roughly double the
  original separation while checking `--text` and `--dim` both stay
  comfortably above AA against the new surface colour.

### Previous session: Venues missing from Search — found the actual cause
Kennedy clarified last session's "no Venues in the filter" was about the
Map (correctly scoped as sessions-only, left as-is) — but separately,
Venues were also missing from Tools → Search itself, which is a real bug.

- **Root cause: `mapVenue` and `mapEvent` both spread `mapClub(r, i)` as a
  shortcut for their overlapping fields — and `mapClub` sets
  `active: r.active === "yes"`, reading a column that only exists on the
  Clubs/Leagues/People sheets.** The Venues and Events sheets don't have
  an `active` column at all, so `r.active` was always `undefined` on
  those rows, `undefined === "yes"` is always `false`, and a blanket
  `items.filter((it) => it.active)` applied to every non-Activities
  category in the fetch step was silently discarding every single Venue
  (and, less visibly since it wasn't reported, every Event too) before
  they ever reached the UI. Confirmed this against the original
  standalone tool's own code: it only ever filtered Clubs, Leagues, and
  People by `active` — Venues and Events were never filtered that way in
  the source this was ported from, so this was introduced by the
  `mapClub`-as-shortcut pattern during the port, not something inherited
  correctly.
- **Fix:** the `active` filter in `components/nbrh-engine.tsx` now only
  applies to Clubs, Leagues, and People — the three categories whose
  sheets actually have that column, matching the original tool's own
  per-category behaviour. Venues and Events pass through unfiltered by
  `active`, same as they did in the source.
- Verified the actual fix logic against a simulated Venues row with no
  `active` column before and after the change (confirmed it was silently
  dropped under the old logic, confirmed it survives under the new logic),
  then rebuilt and re-checked every route on a real server.

### Previous session: three real bugs fixed in Search and Map
Kennedy flagged three things from screenshots after the Search/Map build.
All three were genuine bugs (two of them pre-existing quirks in the
original tools' own code, ported faithfully last session), not new
issues introduced this round.

- **SPONSORED/NEW badges overlapping the session-type badge.** The
  original tool rendered "SPONSORED"/"NEW"/etc. as a CSS `::after`
  pseudo-element, entirely separate from the real `sr-type-badge` div —
  and a sibling selector (`.sr-event-date-badge ~ .sr-type-badge`) was
  supposed to push the type badge down when something else occupied that
  corner, but a sibling selector can't see a `::after` pseudo-element on
  a different ancestor, so it never fired. Both badges sat at the same
  `top: 8px` and overlapped. Fixed by rendering every top-left badge
  (special badge, event date, type) as a real element inside one flex
  column (`sr-badge-stack`) — there's nothing left to get out of sync,
  since the stack just grows to fit whichever badges are actually present.
- **No Venues in the Map's sport filter.** Checked the original map
  tool's own code before assuming this was a bug: it was only ever built
  to plot session (Activities) locations — Venues/Clubs/Leagues/Events/
  People were never in its scope, and it's not clear the Venues sheet
  even has coordinates. Asked rather than silently extending scope;
  Kennedy confirmed: leave the map sessions-only for now.
- **Map marker emojis off-centre, and the click popup not opening.** Two
  separate real bugs, both in `components/nbrh-map.tsx`:
  1. The multi-session count badge was `position: absolute` with no
     `position: relative` on its parent marker div — it was anchoring
     against whatever Leaflet pane happened to be positioned further up
     the DOM instead of the marker itself, which also threw off how the
     whole marker looked. Single-session markers also emitted the emoji
     as a bare text node rather than an element, so there was nothing
     reliable to center. Fixed by wrapping the emoji in its own
     `nbrh-map-marker-emoji` span (absolutely positioned to fill the
     whole circle, centered with flex) and giving the marker itself
     `position: relative` so the count badge anchors correctly.
  2. **The popup was almost certainly mounting on every click — it just
     rendered underneath the map.** `.modal-overlay` (shared by every
     popup in the app) was `z-index: 200`; Leaflet's own panes and
     controls go up to `z-index: 1000`. Raised `.modal-overlay` to
     `1200` — comfortably above Leaflet's stack — since it's meant to be
     the app's topmost layer everywhere and Leaflet is the only
     third-party library in the app that brings its own competing
     z-index scheme.
  3. **Found and fixed while in there, not reported:** the marker-cluster
     plugin (for maps with over 100 distinct locations) was being loaded
     but never actually used to group markers — they were always added
     individually to the same layer regardless. Now the cluster group is
     actually built and populated once the plugin loads.
- Verified against a real running server: confirmed all three CSS fixes
  compiled into the served stylesheet with the expected values (the
  flex badge stack, `z-index: 1200` on `.modal-overlay`, the split
  emoji/count marker classes), confirmed Leaflet's real maximum z-index
  in its own shipped CSS (1000) before picking 1200 rather than guessing,
  and re-ran the full route sweep across old and new pages to rule out
  any regression from raising a shared component's z-index app-wide.

### Previous session: Calendar fixed, Find replaced with Search + Map
Three separate requests, all landed together: fix the Calendar's uneven
cell sizes and add a real event popup, remove Find, and integrate two
real NBRH tools (search engine + interactive map) as new Tools tabs.

- **Calendar cells were uneven because of `min-height`, not layout.** Every
  cell had `min-height: 92px` with no fixed row height, so a week with a
  couple of busy days grew taller than a quiet week right next to it —
  that's what "all separate cell sizes" actually was. Fixed with a real
  fixed height (`108px`, both the cell and `grid-auto-rows`) plus
  `overflow: hidden` and a hard cap of 2 chips per cell (anything beyond
  that collapses into a "+N more" chip) — so every row is now identical
  regardless of how many items land on any given day.
- **Event detail popup added.** Clicking any grid chip or agenda row now
  opens a modal with the full date range, area, type, description, and an
  "Open link" button — instead of the agenda row's old inline "View" link
  being the only way in. Built on the same `.modal-overlay`/`.modal` base
  every other popup in the app uses.
- **Checked Sheets-readiness before assuming a restructure was needed.**
  `Event`/`Opportunity`/`CalendarItem` were already flat, one-row-per-item
  records — exactly what a future Sheets tab looks like. Nothing in
  `CalendarView` needed to change for "live-updating from a Sheet later";
  that's a question of how the *adapter* revalidates (already `lib/data`'s
  job for every other tab), not something the calendar UI needs to know
  about. Added a `description` field to `CalendarItem` so the popup has
  something to show, and documented the seam explicitly in both files so
  a future session doesn't have to rediscover this.
- **Find removed, replaced with two new tabs: Search and Map.** Find was a
  link-out because the real NBRH Engine's source wasn't available last
  session. This session, Kennedy provided the actual Engine and the actual
  interactive map — both real, large, working tools with their own data
  fetching, filtering, and rendering logic.
  - **Search** (`components/nbrh-engine.tsx`) ports the Engine's six
    categories (Activities/Clubs/Leagues/Venues/Events/People), each with
    its own filter fields, sort options, and carousel/list card views —
    same approach as Session Insights: the real logic ported faithfully,
    restyled onto this app's theme (namespaced `sr-`) rather than
    shipping the original's separate design system alongside it. Fetches
    from the same public `opensheet.elk.sh` endpoint the original used.
  - **Map** (`components/nbrh-map.tsx`) ports the interactive Leaflet map
    — custom markers, location clustering above 100 distinct points,
    multi-session popups with prev/next navigation. Leaflet needs
    `window`/`document` and can never run during SSR, so the component is
    loaded through `components/map-client-boundary.tsx`, a thin client
    wrapper enabling `next/dynamic(ssr:false)` (a Server Component page
    can't pass that option directly). Added `leaflet` + `@types/leaflet`
    as real npm dependencies rather than loading Leaflet itself via CDN
    `<script>` tags — the original's own marker-cluster plugin still
    lazy-loads via CDN, since it's genuinely only needed past the
    100-location threshold and isn't worth bundling for every page load.
  - **Different external dependency, worth knowing:** Map's data comes
    from a Google Apps Script web app URL, not `opensheet.elk.sh`. If Map
    ever stops returning data while Search and Insights still work fine,
    that Apps Script deployment specifically is the thing to check.
  - Nav: Tools' sidebar group and mobile tab bar both updated — Contact
    Us / Search / Map / Calendar, Find gone entirely.
- Verified against a real running server across every new and existing
  route (including both demo clubs, an invalid token, and confirming
  `/tools/find` now correctly 404s), plus checked the compiled CSS and
  the server-rendered HTML directly to confirm the SSR boundary around
  Leaflet behaves correctly (loading shell only, no attempt to touch
  `window` server-side) before packaging.

### Previous session: Tools built (Contact Us, Find, Calendar)
Built from the build spec, cross-checked against this repo's own
project-specific spec (`docs/sections/03-05-workspace-tools-services.md`
§ Section 4), which had already reconciled the general spec against this
project's real state — used that as the primary source rather than the
general spec alone.

- **Find had a genuine open question, not a build detail** — the spec
  itself says "ask Kennedy which the Engine supports" (embed vs
  link-out). Checked thenbrh.co.uk directly rather than guessing: the
  NBRH Engine is a widget embedded inline on that page (a Squarespace
  search/filter tool), with no visible standalone URL or prefill
  parameter to build against. Asked instead of assuming — confirmed:
  link out to thenbrh.co.uk in a new tab. `tools/find/page.tsx` is a
  one-file upgrade if the Engine gets a real embeddable URL later.
- **Contact Us built as its own modal**, not a variant of the shared
  `ActionPopup` — that component's UI is a row of black/pink option
  buttons, which doesn't fit a form whose job is picking one type
  (change request/suggestion/bug/help/rating) and writing a message.
  Found that `contact_us` was already a registered action at 0 tokens in
  `data/tokens_reference.json`, and already used by `ActionPopup`'s own
  "Report an issue" flow — so this reuses that exact action key and the
  same ledger pipeline (`submitFreeAction`) rather than inventing a new
  one.
- **Calendar** combines a new `Events` tab (`data/events.json`, seed data
  added) with dated `Opportunities` rows, per D6's v1 proposal — checked
  DECISIONS.md's own definitions first: D6 is PROPOSED, not OPEN, so
  building v1 without asking is correct (OPEN blocks; PROPOSED is a
  default you build unless overridden). One component
  (`components/calendar-view.tsx`) renders both a desktop month grid and
  a mobile agenda list from the same data, switched by the existing
  780px breakpoint — the spec explicitly warns against squeezing a grid
  onto mobile, so the agenda list isn't a fallback, it's the intended
  mobile design.
- **Nav**: Tools is now a real collapsible sidebar group (Contact Us /
  Find / Calendar) and a real mobile tab, matching Outreach and
  Workspace. Only Services remains a "coming soon" stub.
- **Flagged, not built**: the original Overview spec calls for a
  universal search bar and a header help icon linking to FAQ — neither
  exists in the app shell. That's a pre-existing gap from the Overview
  build, not something this session's "just add Tools" scope should
  quietly absorb — noted in "Next" above instead.
- Verified against a real running server across every new and existing
  route, including both demo clubs and an invalid token, before
  packaging — same standing practice as every session since the
  build-clean-crash-on-load bug.

**Also found, not caused by this session:** `data/opportunities.json`
has genuinely different content than any session's own build left it
with — different titles, dates, and areas (a Newham entry now exists that
no session added), though the seeded call-out from a previous session
(`op_007`) is still there alongside a second one that wasn't seeded here
(`op_005`). This looks like a direct edit on GitHub between sessions, not
a bug — Calendar's item counts above were verified against this actual
current file, not stale data, so nothing here is broken. Flagging so a
future session doesn't mistake this for corruption, and doesn't overwrite
real edits by assuming its own memory of the file is authoritative.

### Previous session: Insights — real code found and integrated
Kennedy provided the actual standalone HTML tool referenced by the build
spec as "existing Insights page code" — a platform-wide session-data
dashboard (price, ratings, capacity, popularity across every NBRH session),
fetching live from a public Google Sheet, with its own design system.

- **Confirmed it's genuinely a different thing** from what "Insights"
  meant in last session's build: that one is club-specific (this club's
  completeness score vs. similar clubs nearby); this one is the same for
  every club, platform-wide. Rather than picking one, both are on the page
  now — club-specific at the top (actionable, personalised), platform-wide
  below it (general context, clearly labelled "Beyond your club").
- **Ported, not embedded.** The original is a full standalone HTML
  document — its own fonts, its own CSS variables, its own nav/footer. Its
  actual card-building logic (the rank-card top/bottom toggle, the sport/
  borough/day filter bar, all the stat calculations) is ported faithfully
  into `components/session-insights.tsx` as a client component, restyled
  onto this app's own design tokens rather than shipping a second parallel
  CSS system.
- **Kept as a separate data path on purpose.** This fetches directly from
  `opensheet.elk.sh` client-side — not through `lib/data`. That's not an
  oversight: `lib/data` exists specifically to enforce per-club scoping
  (CLAUDE.md rule 1), and there's no club data here to scope — it's the
  same numbers for everyone. Routing it through that layer would blur a
  distinction worth keeping visible. See `docs/schema.md` § Core Sessions
  and this component's own top-of-file comment.
- Rebuilt the rest of Workspace (Opportunities, Resources, FAQ, Copy
  Generator tile, nav) from scratch on top of the actual current repo
  state, since last session's Workspace zip hadn't been uploaded — see the
  note above. Same content as before, verified fresh against a real server
  rather than assumed carried over.

### Previous session: entry-row redesign + splash pages
Fixed the entry-row spacing/density Kennedy flagged (text sat right
against the row edges; a 3-column grid layout with real padding replaced
the old flex layout), and added two splash/welcome screens — general at
`/`, personalised per club at `/dashboard/[clubToken]/welcome`. The old
pilot club-picker moved from `/` to `/directory`.

### Earlier session: collapsible pattern removed from Outreach entries
Kennedy flagged (with his own demo screenshot as reference) that the
collapsible entry-card pattern didn't work — every player/person/brand
collapsed into a bare toggle row, when his own demo shows plain rows with
real context always visible (name, one line describing what they're
looking for, a status chip, an action button). Rebuilt `EntryCard` from
scratch to match: one plain row per entry, everything visible immediately.
The "i" button still reveals a small detail strip inline (fields that
genuinely don't fit in the row), but that's the only expand/collapse left.

### Earlier session: readability + desktop bugs
1. **Grey boxes on Overview (desktop only)** — a toggle button's
   "invisible" styling only existed inside a mobile media query; fixed
   with one style that's correct everywhere.
2. **"Collapsible on mobile" was mobile-only** when desktop collapse was
   wanted too — both `CollapsibleCard` and `EntryCard` rebuilt so their
   header row is a real toggle at every width.
3. **Text contrast was failing WCAG AA** in ~19 places (3.0–3.4:1 against
   a 4.5:1 requirement) — found by calculating actual ratios, not
   eyeballing. Introduced `--faint-text` for anywhere `--faint` was
   holding real text.
4. **Sort added** — a dropdown next to Filter on every Outreach
   subsection, hidden entirely for pre-priorities clubs.
5. **Match score, compact + square** — `MatchScoreBadge` gained a
   `compact` prop for the tight entry-card header row.

Every fix above and since has been verified against a real running server
and its request log, not just a clean `npm run build` — a previous
session's crash also built clean and only failed once a real page loaded,
so a green build alone is never treated as proof here.
