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
      <p className="for-you-login-intro">
        Already have an account? Enter your registered email address to see your favourites and
        matches.
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
