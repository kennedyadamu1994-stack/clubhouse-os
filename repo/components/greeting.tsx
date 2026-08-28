"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Users, LayoutGrid, Wrench } from "lucide-react";

/** Matches the original concept: hour-based greeting, computed client-side to avoid a server/client mismatch on render. */
export function Greeting() {
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  return <>{greeting}</>;
}

export function DateLine() {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    );
  }, []);
  return <p className="deck-date">{dateStr}</p>;
}

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

  return (
    <div className="tokens" aria-label={`${balance} of ${allocation} tokens remaining`}>
      <div>
        <div className="count">
          <em>{balance}</em> / {allocation}
        </div>
        <div className="meta">tokens left</div>
      </div>
      <div>
        <div className="tokenbar" role="presentation">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
