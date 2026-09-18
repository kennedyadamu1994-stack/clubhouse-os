"use client";

import { usePathname } from "next/navigation";
import { Users, LayoutGrid, Wrench } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Flat greeting (Kennedy's request, 9 Sep — replacing the previous hour-based "Good morning/afternoon/evening", which read the visitor's own device clock and could show the wrong one depending on their local time/timezone). No longer needs client-side state at all, since the text never changes after first render. */
export function Greeting() {
  return <>Hello</>;
}

/* DateLine (the "Friday 18 September" eyebrow next to the theme toggle)
   removed entirely, 19 Sep — Kennedy: "remove the date from the POS &
   CHOS." It rendered in exactly two places, both deck headers
   (ClubDeckHeader below, PlayerDeckHeader in components/player-nav.tsx)
   — both call sites were updated in the same pass so nothing still
   imports it. See git history for the removed implementation if a date
   display is ever wanted back. */

const TITLES: Record<string, string> = {
  services: "Services",
  membership: "Membership",
};

/**
 * Every sub-page under outreach/workspace/tools shows its SECTION title
 * (with that section's icon) rather than its own subsection title — e.g.
 * workspace/insights shows "Workspace", not "Insights". Kennedy's request:
 * the page title should reflect the main section a page lives in. Overview
 * and Priorities aren't under any of those three, so they're untouched and
 * keep their own titles exactly as before.
 */
const SECTION_TITLES: Record<string, { label: string; Icon: typeof Users }> = {
  outreach: { label: "Outreach", Icon: Users },
  workspace: { label: "Workspace", Icon: LayoutGrid },
  tools: { label: "Tools", Icon: Wrench },
};

/** Per-section page title, matching the original concept's dynamic deck-title (Overview → Outreach → etc). */
export function PageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // segments[0..1] are always "dashboard"/"[clubToken]" — segments[2] is the
  // top-level section (outreach/workspace/tools/services/membership) when present.
  const section = segments[2];
  const sectionTitle = section ? SECTION_TITLES[section] : undefined;
  if (sectionTitle) {
    const { label, Icon } = sectionTitle;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <Icon size={26} aria-hidden />
        {label}
      </span>
    );
  }
  const last = segments[segments.length - 1];
  return <>{TITLES[last] ?? "Overview"}</>;
}

/**
 * Whole deck-head ROW for CHOS (18 Sep follow-up, Kennedy: same
 * "only the home page header" correction as POS's own — see
 * PlayerDeckHeader's doc comment in components/player-nav.tsx for the
 * fuller story of what went wrong and why). The 18 Sep same-day change
 * had removed the "Hello"/date eyebrow and moved the theme toggle
 * under the carousel across ALL of CHOS, since it lived directly in
 * app/dashboard/[clubToken]/layout.tsx, which wraps every CHOS page —
 * correct for Overview, never asked for on Outreach/Workspace/Tools/
 * Services.
 *
 * Overview is exactly segments.length === 2 (["dashboard", token],
 * nothing further) — the same check PageTitle's own fallback
 * effectively relies on (no matched section, last segment isn't a
 * known TITLES key). Overview gets the no-eyebrow / toggle-under-
 * carousel treatment; every other page gets back its original eyebrow
 * "Hello, {clubName}" + date + inline toggle + TokenWidget, unchanged
 * from before 18 Sep. TokenWidget itself already has its own separate
 * Overview-only check (see that component's own doc comment) so it's
 * rendered here unconditionally and trusted to hide itself.
 */
export function ClubDeckHeader({
  clubName,
  balance,
  allocation,
  pct,
}: {
  clubName: string;
  balance: number;
  allocation: number;
  pct: number;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isOverview = segments.length === 2;

  if (isOverview) {
    return (
      <>
        <div className="deck-toggle-row">
          <ThemeToggle />
        </div>
        <header className="deck-head">
          <h1 className="deck-title">
            <PageTitle />
          </h1>
          <TokenWidget balance={balance} allocation={allocation} pct={pct} />
        </header>
      </>
    );
  }

  return (
    <header className="deck-head">
      <div>
        <p className="eyebrow">
          <Greeting />, {clubName}
        </p>
        <h1 className="deck-title">
          <PageTitle />
        </h1>
      </div>
      <div className="deck-head-controls">
        <TokenWidget balance={balance} allocation={allocation} pct={pct} />
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * Renders the token balance widget only on the exact Overview route
 * (/dashboard/[clubToken], no further path segments) — Kennedy's request
 * to move the token bar off every other page. Same client-side
 * pathname-detection pattern as PageTitle, so there's no server/client
 * mismatch: the balance/allocation/pct values are still computed
 * server-side in the layout (they need live data), this component just
 * decides whether to show the markup it's handed.
 */
export function TokenWidget({
  balance,
  allocation,
  pct,
}: {
  balance: number;
  allocation: number;
  pct: number;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // /dashboard/[clubToken] → exactly 2 segments. Any sub-page (outreach/players,
  // workspace/trending, services, etc.) has 3+ and should not show this.
  const isOverview = segments.length === 2;
  if (!isOverview) return null;

  // Ring gauge (28 Aug — replaces the plain progress bar with a genuine
  // infographic treatment for one of the most-visible numbers in the
  // app). r=15, so circumference = 2*pi*15 ≈ 94.2 — dash values below are
  // pre-computed off that so the ring never needs runtime trig.
  const circumference = 94.2;
  const dashOffset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <div className="tokens" aria-label={`${balance} of ${allocation} tokens remaining`}>
      <svg width="36" height="36" viewBox="0 0 36 36" className="tokens-ring" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-2)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="var(--pink)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div>
        <div className="count">
          <em>{balance}</em> / {allocation}
        </div>
        <div className="meta">tokens left</div>
      </div>
    </div>
  );
}
