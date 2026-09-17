"use client";

import { useState } from "react";
import { submitPlayerAction } from "@/lib/players/actions";
import { usePlayerSession } from "./player-session";

/**
 * Player Contact Us / Request a Feature (15 Sep) — a real form, not a
 * modal popup the way CHOS's own ContactButton/ContactUsForm work;
 * simpler and more discoverable as a plain page, matching how Guide/
 * Club Store are plain pages too. Pre-fills email from the signed-in
 * session when available (usePlayerSession), but doesn't require
 * signing in — anyone can use this, matching CHOS's own Contact page,
 * which likewise has no login of its own.
 */
export function PlayerContactForm({ actionKey, submitLabel }: { actionKey: "player_contact_us" | "player_feature_request"; submitLabel: string }) {
  const { email: sessionEmail } = usePlayerSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(sessionEmail ?? "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ state: "idle" } | { state: "submitting" } | { state: "done" } | { state: "error"; message: string }>({
    state: "idle",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ state: "submitting" });
    const result = await submitPlayerAction({ name, email, action_key: actionKey, message });
    if (!result.ok) {
      setStatus({ state: "error", message: result.error ?? "Something went wrong. Please try again." });
      return;
    }
    setStatus({ state: "done" });
    setMessage("");
  }

  if (status.state === "done") {
    return <p style={{ color: "var(--dim)", fontSize: "0.9rem" }}>Thanks — we&apos;ve got your message.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="text"
        className="onboard-input"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        className="onboard-input"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <textarea
        className="onboard-textarea"
        placeholder="Your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      {status.state === "error" && <p className="onboard-error">{status.message}</p>}
      <button type="submit" className="btn btn-pink" disabled={status.state === "submitting"}>
        {status.state === "submitting" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
