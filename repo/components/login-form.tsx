"use client";

import { useState } from "react";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const result = await loginAction(email, password);
    if (result.ok) {
      // A hard navigation (not router.push) — the session cookie was
      // just set by the server action, and the simplest way to
      // guarantee the very next request actually carries it is a real
      // page load, not a soft client-side transition.
      window.location.href = "/admin/requests";
      return;
    }
    setError(result.error);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="field" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label htmlFor="admin-email" style={{ display: "block", fontSize: "0.82rem", marginBottom: 4 }}>
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="admin-password" style={{ display: "block", fontSize: "0.82rem", marginBottom: 4 }}>
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
      <button type="submit" className="btn btn-pink" disabled={isSubmitting} style={{ marginTop: 4 }}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
