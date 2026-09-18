"use client";

import { useState } from "react";
import { usePlayerSession } from "./player-session";

/**
 * The real email sign-in form (15 Sep — Kennedy: "moving that from For
 * You To the Home Page"). Previously lived only inside ForYouView; now
 * this is its own component, rendered on Home as the one section that
 * stays open by default (everything else on the redesigned Home page
 * is a collapsed dropdown — Kennedy: "everything in drop downs apart
 * from sign in card"). For You itself, when signed out, now points
 * here instead of duplicating this same form — see ForYouView's own
 * updated signed-out state.
 */
export function PlayerSignInCard() {
  const { player, error: sessionError, login, loading: sessionLoading } = usePlayerSession();
  const [loginEmail, setLoginEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

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

  if (player) {
    return null; // Home renders the signed-in account/demographics dropdowns instead once player is known
  }

  return (
    <div className="for-you-login" style={{ margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>Sign in</h2>
      {/* Condensed (18 Sep, Kennedy: "reduce the copy... make sure you
          sell the value of signing up if the user hasn't already") —
          was two full paragraphs (~75 words) that mostly repeated the
          same point twice: the first paragraph said registration was
          required and free, the second said it again in different
          words before finally getting to the actual instruction (enter
          your email). One paragraph now: opens with the concrete
          benefit (sessions matched to you) rather than the process (an
          account is required) — that's the actual sell — then the
          free/two-minutes reassurance, then the one instruction that
          covers both new and returning visitors. The "Create a free
          account" link further down still covers anyone who hasn't
          signed up yet, so this text doesn't need to spell that out
          separately. */}
      <p className="for-you-login-intro">
        Get sessions matched to your location, sports, and skill level — free, and it takes
        under two minutes to join. Already registered? Enter your email below.
      </p>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          className="onboard-input"
          placeholder="your@email.com"
          aria-label="Email address"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn btn-pink" disabled={loggingIn}>
          {loggingIn ? "Signing in…" : "Sign in"}
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
