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
 * REBUILT MULTIPLE TIMES (15-16 Sep, see git history / earlier doc
 * comments for the fuller story) — no search box, no width cap, no
 * Search Insights, a real welcome heading.
 *
 * LATEST REVISION (16 Sep):
 *   - "The Neighbourhood" eyebrow removed (Kennedy: "remove 'the
 *     Neighbourhood' subtitle on the home page").
 *   - Demographics moved into its own collapsed dropdown (Kennedy:
 *     "move all the demographic info for the user when they sign in to
 *     a drop down box") — account data (email, favourite sport, etc.)
 *     stays directly visible as the immediate summary; demographics is
 *     the one genuinely secondary layer now, same collapse pattern as
 *     "From The NBRH".
 *   - "From The NBRH" now only renders once signed in (Kennedy: "once
 *     some has signed in, The from the NBRH shows up... acting as a
 *     bulletin board") — a visitor who hasn't signed in sees only the
 *     welcome heading and the sign-in card, nothing else; the bulletin
 *     board itself is a real redesign too, see NbrhUpdatesFeed's own
 *     doc comment.
 */
export default function PublicHome() {
  const { player, email, loading } = usePlayerSession();

  return (
    <div style={{ padding: "8px 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
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
        <>
          <div className="card outreach-card" style={{ marginBottom: 20 }}>
            <h2 style={{ marginBottom: 4 }}>
              Hey, <span style={{ color: "var(--pink)" }}>{player.name?.split(" ")[0] ?? "there"}</span> 👋
            </h2>
            <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 18 }}>Your account</p>
            <AccountDataGrid player={player} email={email} />
          </div>

          <CollapsibleCard id="demographics" heading="Your Demographics" defaultOpen={false}>
            <DemographicsGrid player={player} />
          </CollapsibleCard>

          <div style={{ height: 16 }} />

          <div className="card outreach-card">
            <NbrhUpdatesFeed />
          </div>
        </>
      ) : (
        <div className="card outreach-card">
          <PlayerSignInCard />
        </div>
      )}
    </div>
  );
}
