"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
import { AccountDataGrid, DemographicsGrid } from "@/components/player-account-info";
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
 * grand" redesign; this fully replaces it). The sign-in card
 * (PlayerSignInCard, moved here from For You) is the one section that
 * stays open; once signed in, it renders nothing itself and this page
 * shows the real account/demographics grids in its place.
 *
 * REVISED AGAIN (15 Sep follow-up):
 *   - No more artificial maxWidth: 640 cap — Kennedy: "increase the
 *     width of the white cards to be inline with the CHOS." Nothing
 *     else in this app constrains .main's own real width (it's flex:1,
 *     width:100% by design); this page was the one outlier, making its
 *     cards read narrower/more cramped than every other real page.
 *   - Search Insights removed entirely (Kennedy: "remove the Search
 *     insights from the home page") — CondensedInsights/its import are
 *     gone from this page, not just hidden.
 *   - A real welcome message added above everything else (Kennedy:
 *     "The home page needs to feel like a home page. Bold and
 *     welcoming... there should be a welcome message") — a genuine
 *     serif heading, the same visual language (var(--font-head), a
 *     pink-accented word) the "/" choice screen and welcome splash
 *     pages already use for their own hero moments, not a new style
 *     invented for this one page.
 */
export default function PublicHome() {
  const { player, email, loading } = usePlayerSession();

  return (
    <div style={{ padding: "8px 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          The Neighbourhood
        </p>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: 36, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 8 }}>
          Welcome to <em style={{ color: "var(--pink)", fontStyle: "normal" }}>The NBRH</em>
        </h1>
        <p style={{ color: "var(--dim)", fontSize: "0.98rem", maxWidth: "60ch" }}>
          Free sessions, clubs, leagues, and opportunities across London — everything you need,
          all in one place.
        </p>
      </div>

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
    </div>
  );
}
