"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
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
 * part of the personal greeting itself), so the duplication is
 * intentional, not an oversight.
 *
 * LATEST REVISION (16 Sep follow-up) — account-data card and
 * demographics dropdown both removed entirely (Kennedy: "It's not
 * really adding anything") — a signed-in visitor sees the greeting and
 * the bulletin board directly, nothing else between them.
 *
 * 19 Sep — the "Free sessions, clubs, leagues..." subtitle paragraph
 * under the h1 is removed entirely, same request/reasoning as the
 * public Home page's own removal (see that page's doc comment). The
 * h1 itself is untouched — unlike the public page, this one never had
 * its own heading moved into the shared deck-title slot, so it still
 * renders here in the page body; that's a pre-existing difference
 * between the two Home pages, not something this pass was asked to
 * change, so it's left as-is.
 */
export default function PlayerHome() {
  const { player, email, loading } = usePlayerSession();

  return (
    <div style={{ padding: "8px 0 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 400, fontSize: 36, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          Welcome back to <em style={{ color: "var(--pink)", fontStyle: "normal" }}>The NBRH</em>
        </h1>
      </div>

      {loading ? (
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      ) : player && email ? (
        <div className="card outreach-card">
          <h2 style={{ marginBottom: 4 }}>
            Hey, <span style={{ color: "var(--pink)" }}>{player.name?.split(" ")[0] ?? "there"}</span> 👋
          </h2>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 18 }}>Good to see you back.</p>
          <NbrhUpdatesFeed />
        </div>
      ) : (
        <div className="card outreach-card">
          <PlayerSignInCard />
        </div>
      )}
    </div>
  );
}
