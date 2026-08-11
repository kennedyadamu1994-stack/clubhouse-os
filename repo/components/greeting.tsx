"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
  players: "Player outreach",
  people: "People",
  brands: "Brand outreach",
  influencers: "Influencers",
  sponsorship: "Sponsorship & Funding",
  clubs: "Club outreach",
  priorities: "Your priorities",
  insights: "Insights",
  opportunities: "Opportunities",
  resources: "Resources",
  faq: "FAQ",
  "copy-generator": "Copy Generator",
  contact: "Contact Us",
  search: "Search",
  map: "Map",
  calendar: "Calendar",
};

/** Per-section page title, matching the original concept's dynamic deck-title (Overview → Player outreach → etc). */
export function PageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
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
  // workspace/insights, priorities, etc.) has 3+ and should not show this.
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
        <div className="meta" style={{ marginTop: 4 }}>
          1 token ≈ 1 hour of NBRH time
        </div>
      </div>
    </div>
  );
}
