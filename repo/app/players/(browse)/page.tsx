"use client";

import { usePlayerSession } from "@/components/player-session";
import { PlayerSignInCard } from "@/components/player-signin-card";
import { NbrhUpdatesFeed } from "@/components/nbrh-updates-feed";

/**
 * Public POS Home — lives at /players itself, inside the full shell
 * ((browse) layout: header, sidebar, tab bar, footer, header carousel).
 *
 * REBUILT MULTIPLE TIMES (15-16 Sep, see git history / earlier doc
 * comments for the fuller story) — no search box, no width cap, no
 * Search Insights, a real welcome heading, no "The Neighbourhood"
 * eyebrow, "From The NBRH" only renders once signed in.
 *
 * LATEST REVISION (16 Sep follow-up) — the account-data card and the
 * "Your Demographics" dropdown are both gone entirely now (Kennedy:
 * "remove the your demographics dropdown and the your account card.
 * It's not really adding anything") — a signed-in visitor now sees
 * just the personal greeting and the bulletin board directly, nothing
 * else between them. AccountDataGrid/DemographicsGrid (components/
 * player-account-info.tsx) are no longer imported here at all; that
 * file itself is left in place rather than deleted, since it's real,
 * working code that isn't causing any harm sitting unused.
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
