"use client";

import { useEffect, useState } from "react";
import { usePlayerSession } from "@/components/player-session";
import { PlayerInboxList } from "@/components/player-inbox-list";
import { EmptyState } from "@/components/empty-state";
import { getPlayerInboxMessagesAction } from "@/lib/players/actions";
import type { PlayerInboxMessage } from "@/lib/types";

/**
 * Player Inbox (15 Sep, Kennedy: "add the inbox feature to the POS...
 * work similar to how the CHOS inbox works... taken from a worksheet
 * called P INBOX"). Mirrors CHOS's own Inbox page (app/dashboard/
 * [clubToken]/inbox/page.tsx) structurally — count badge, unread
 * subtitle, EmptyState — but keyed by the email session, same pattern
 * as Favourites, since P INBOX routes by a real Email column rather
 * than a club token/ID.
 *
 * A client component, not a server page — same reasoning as
 * Favourites' own page: the identity here is the email session
 * (usePlayerSession), which only exists client-side, so there's no
 * server-side player token to look this page up by. Messages
 * themselves are fetched via a Server Action (getPlayerInboxMessagesAction)
 * once the session's email is known, refetched via refreshInboxCount's
 * own trigger whenever that email changes.
 */
export default function PlayerInbox() {
  const { player, email, loading } = usePlayerSession();
  const [messages, setMessages] = useState<(PlayerInboxMessage & { read: boolean })[] | null>(null);

  useEffect(() => {
    if (!email) {
      setMessages(null);
      return;
    }
    getPlayerInboxMessagesAction(email).then(setMessages);
  }, [email]);

  if (loading) {
    return (
      <div className="card outreach-card">
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      </div>
    );
  }

  if (!player || !email) {
    return (
      <div className="card outreach-card">
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
          Sign in to see your messages.
        </p>
        <EmptyState
          message="Your Inbox is personal to you — sign in with your email to see your messages."
          cta="Sign in"
          href="/players"
        />
      </div>
    );
  }

  if (messages === null) {
    return (
      <div className="card outreach-card">
        <div className="sr-loading">
          <div className="sr-spin" />
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="card outreach-card">
      <div className="inbox-page-header">
        <h2>
          Inbox <span className="count-badge">{messages.length} messages</span>
        </h2>
        <p className="inbox-page-subtitle">
          {unreadCount > 0
            ? `${unreadCount} unread, correspondence and updates from The NBRH.`
            : "Correspondence and updates from The NBRH."}
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState message="No messages yet, anything we send you will show up here." cta="Back to Home" href="/players" />
      ) : (
        <PlayerInboxList email={email} messages={messages} />
      )}
    </div>
  );
}
