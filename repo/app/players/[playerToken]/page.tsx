"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
import { AccountDataGrid, DemographicsGrid } from "@/components/player-account-info";
import { CollapsibleCard } from "@/components/collapsible-card";
import { NbrhUpdatesFeed } from "@/components/nbrh-updates-feed";

/**
 * Personal Home — identical to the public Home page's own latest
 * rebuild (16 Sep, see app/players/(browse)/page.tsx's own doc comment
 * for the fuller story). The only real difference is the welcome
 * heading itself — this page always has a specific player behind the
 * token (even before their profile resolves), so it reads as "Welcome
 * back" rather than the public tree's generic platform-wide greeting;
 * the layout above it (app/players/[playerToken]/layout.tsx) already
 * shows its own personal "Hey, {name}" line in the deck header, and
 * this page's own signed-in card repeats a first-name greeting too —
 * the two serve different roles (deck header = page chrome, in-card =
 * part of the account summary itself), so the duplication is
 * intentional, not an oversight.
 *
 * LATEST REVISION (16 Sep) — same three changes as the public page:
 * no "The Neighbourhood" eyebrow, demographics moved into its own
 * collapsed dropdown, "From The NBRH" only renders once signed in.
 */
export default function PlayerHome() {
  const { player, email, loading } = usePlayerSession();

  return (
    <div style={{ padding: "8px 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: 36, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 8 }}>
          Welcome back to <em style={{ color: "var(--pink)", fontStyle: "normal" }}>The NBRH</em>
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
