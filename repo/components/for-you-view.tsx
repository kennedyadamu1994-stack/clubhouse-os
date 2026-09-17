"use client";

import { useEffect, useState } from "react";
import { usePlayerSession } from "./player-session";
import { scoreRecommendations, type ScoredItem } from "@/lib/players/for-you-scoring";
import { ForYouCard } from "./for-you-card";
import { EmptyState } from "./empty-state";

/**
 * "For You" — the real recommendations engine (15 Sep rewrite,
 * replacing the earlier reason-chip version) housed inside the POS
 * shell, in this same window, never linking out to Search or anywhere
 * else (Kennedy, 15 Sep: "it should not link to the search function,
 * it should reveal in the same window the recommendations list, in
 * the OS design"). Once signed in, scoreRecommendations (lib/players/
 * for-you-scoring.ts, the direct scoring-algorithm port) runs and
 * results render as ForYouCard rows, right here, no navigation.
 *
 * The real sign-in form itself no longer lives here — it moved to Home
 * (PlayerSignInCard, components/player-signin-card.tsx — Kennedy, 15
 * Sep: "moving that from For You To the Home Page"). When signed out,
 * this page points to Home instead of duplicating that same form.
 *
 * One component used by both the public and personal Search trees —
 * the identity here is the email session (usePlayerSession),
 * genuinely independent of whether a playerToken happens to be in the
 * current URL, so this page looks and behaves identically either way.
 */
export function ForYouView() {
  const { player, loading: sessionLoading } = usePlayerSession();

  const [scored, setScored] = useState<ScoredItem[] | null>(null);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    if (!player) {
      setScored(null);
      return;
    }
    setScoring(true);
    scoreRecommendations(player).then((result) => {
      setScored(result);
      setScoring(false);
    });
  }, [player]);

  if (sessionLoading) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <EmptyState
        message="Recommendations are personal to you — sign in on Home to see sessions matched to your profile."
        cta="Sign in on Home"
        href="/players"
      />
    );
  }

  return (
    <div>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 4 }}>
        Hey, <strong style={{ color: "var(--text)" }}>{player.name?.split(" ")[0] ?? "there"}</strong> 👋
      </p>
      {scoring ? (
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      ) : scored && scored.length > 0 ? (
        <>
          <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 16 }}>
            We found <strong style={{ color: "var(--pink)" }}>{scored.length}</strong> session
            {scored.length !== 1 ? "s" : ""} that match your profile.
          </p>
          <div className="entry-list">
            {scored.map((s, i) => (
              <ForYouCard key={s.item.id} scored={s} rank={i + 1} />
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", textAlign: "center", padding: "32px 0" }}>
          We couldn&apos;t find any matching sessions right now — check back soon as new sessions
          are added.
        </p>
      )}
    </div>
  );
}
