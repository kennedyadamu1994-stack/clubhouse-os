"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
import { AccountDataGrid, DemographicsGrid } from "@/components/player-account-info";
import { CondensedInsights } from "@/components/condensed-insights";
import { CollapsibleCard } from "@/components/collapsible-card";
import { NbrhUpdatesFeed } from "@/components/nbrh-updates-feed";

/**
 * Personal Home — identical to the public Home page's own rebuild (15
 * Sep, see app/players/(browse)/page.tsx's own doc comment for the
 * full reasoning). The only difference is this one lives under a real
 * player token — the layout above it (app/players/[playerToken]/
 * layout.tsx) already shows a personal "Hey, {name}" greeting in the
 * deck header, and this page's own signed-in card repeats a first-name
 * greeting too, matching Home's public-tree structure exactly rather
 * than trying to avoid the duplication, since the two greetings serve
 * different roles (deck header = page chrome, in-card = part of the
 * account summary itself).
 */
export default function PlayerHome() {
  const { player, email, loading } = usePlayerSession();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
      {loading ? (
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      ) : player && email ? (
        <div className="card outreach-card" style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 4 }}>
            Hey, <span style={{ color: "var(--pink)" }}>{player.name?.split(" ")[0] ?? "there"}</span> 👋
          </h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 18 }}>Your account</p>
          <AccountDataGrid player={player} email={email} />
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", margin: "22px 0 18px" }}>Your demographics</p>
          <DemographicsGrid player={player} />
        </div>
      ) : (
        <div className="card outreach-card" style={{ marginBottom: 20 }}>
          <PlayerSignInCard />
        </div>
      )}

      <CollapsibleCard id="nbrh-updates" heading="From The NBRH" defaultOpen={false}>
        <NbrhUpdatesFeed />
      </CollapsibleCard>

      <div style={{ height: 16 }} />

      <CollapsibleCard id="condensed-insights" heading="Search Insights" defaultOpen={false}>
        <CondensedInsights />
      </CollapsibleCard>
    </div>
  );
}
