"use client";

import { useEffect, useState } from "react";
import { usePlayerSession } from "./player-session";
import { scoreRecommendations, type ScoredItem } from "@/lib/players/for-you-scoring";
import { ForYouCard } from "./for-you-card";

/**
 * "For You" — the real recommendations engine (15 Sep rewrite,
 * replacing the earlier reason-chip version) housed inside the POS
 * shell, in this same window, never linking out to Search or anywhere
 * else (Kennedy, 15 Sep: "it should not link to the search function,
 * it should reveal in the same window the recommendations list, in
 * the OS design"). Login screen matches the attached widget's own
 * email-lookup flow; once signed in, scoreRecommendations (lib/
 * players/for-you-scoring.ts, the direct scoring-algorithm port) runs
 * and results render as ForYouCard rows, right here, no navigation.
 *
 * One component used by both the public and personal Search trees —
 * the identity here is the email session (usePlayerSession),
 * genuinely independent of whether a playerToken happens to be in the
 * current URL, so this page looks and behaves identically either way.
 */
export function ForYouView() {
  const { player, email, loading: sessionLoading, error: sessionError, login } = usePlayerSession();
  const [loginEmail, setLoginEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    await login(loginEmail);
    setLoggingIn(false);
  }

  if (sessionLoading) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="for-you-login">
        <h2 style={{ marginBottom: 8 }}>Your Personalised Recommendations</h2>
        <p className="for-you-login-intro">
          Already have an account? Enter your registered email address and we&apos;ll pull up
          sessions matched to your profile and preferences.
        </p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            className="onboard-input"
            placeholder="your@email.com"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-pink" disabled={loggingIn}>
            {loggingIn ? "Finding your sessions…" : "Find my sessions"}
          </button>
        </form>
        {sessionError && <p className="onboard-error" style={{ marginTop: 12 }}>{sessionError}</p>}
        <p style={{ color: "var(--dim)", fontSize: "0.82rem", marginTop: 24 }}>
          No account yet?{" "}
          <a href="/players/onboard" style={{ color: "var(--pink)" }}>
            Create a free account
          </a>
        </p>
      </div>
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
