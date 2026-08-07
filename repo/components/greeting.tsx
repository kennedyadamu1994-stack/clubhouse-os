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
};

/** Per-section page title, matching the original concept's dynamic deck-title (Overview → Player outreach → etc). */
export function PageTitle() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return <>{TITLES[last] ?? "Overview"}</>;
}
