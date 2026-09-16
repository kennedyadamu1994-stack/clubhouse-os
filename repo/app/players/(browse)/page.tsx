"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
import { AccountDataGrid, DemographicsGrid } from "@/components/player-account-info";
import { CondensedInsights } from "@/components/condensed-insights";
import { CollapsibleCard } from "@/components/collapsible-card";
import { NbrhUpdatesFeed } from "@/components/nbrh-updates-feed";

/**
 * Public POS Home — lives at /players itself, inside the full shell
 * ((browse) layout: header, sidebar, tab bar, footer, header carousel).
 *
 * REBUILT (15 Sep, Kennedy: "remove the search bar from the home page
 * as there is already a search page. Perhaps replace demographics,
 * from the NBRH, super condensed insights & sign in section (moving
 * that from For You To the Home Page). Perhaps everything in drop
 * downs apart from sign in card") — no more search box or live
 * cross-category results (that was an earlier "make Home feel more
 * grand" redesign; this fully replaces it, Kennedy's later instruction
 * standing on its own, not layered on top of the old one). The sign-in
 * card (PlayerSignInCard, moved here from For You) is the one section
 * that stays open; once signed in, it renders nothing itself and this
 * page shows the real account/demographics grids in its place, both
 * also read-only, not behind a dropdown either — the two are treated
 * the same way: whichever is relevant to the current signed-in state
 * is the thing that's always visible, everything else genuinely
 * secondary (From The NBRH, Condensed Insights) collapses.
 */
export default function PublicHome() {
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
