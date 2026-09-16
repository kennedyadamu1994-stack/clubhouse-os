"use client";

import { useState, useTransition } from "react";
import { markPlayerInboxReadAction } from "@/lib/players/actions";
import { usePlayerSession } from "./player-session";
import type { PlayerInboxMessage } from "@/lib/types";

/**
 * Player-side equivalent of InboxList (components/inbox-list.tsx) —
 * same real email-inbox design (sender avatar, unread bold + dot,
 * message preview, relative dates, expand-to-read-and-mark-read) and
 * same CSS classes (.inbox-row, .inbox-avatar, etc.), keyed by email
 * instead of clubToken/club_id — mirrors that component's own
 * functions (preview, relativeDate) verbatim rather than reimporting
 * them, since they're small, private helpers, not exported.
 *
 * Calls refreshInboxCount() from the shared session context after
 * marking a message read (same pattern PlayerFavouriteHeart already
 * uses for refreshFavourites) so the header's own unread badge updates
 * immediately, not just this page's own local optimistic state.
 */
const PREVIEW_LENGTH = 80;

function preview(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= PREVIEW_LENGTH) return clean;
  return clean.slice(0, PREVIEW_LENGTH).trimEnd() + "…";
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PlayerInboxList({
  email,
  messages,
}: {
  email: string;
  messages: (PlayerInboxMessage & { read: boolean })[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const { refreshInboxCount } = usePlayerSession();

  function toggle(message: PlayerInboxMessage & { read: boolean }) {
    const isOpen = openId === message.message_id;
    setOpenId(isOpen ? null : message.message_id);
    if (!isOpen && !message.read && !locallyRead.has(message.message_id)) {
      setLocallyRead((prev) => new Set(prev).add(message.message_id));
      startTransition(async () => {
        await markPlayerInboxReadAction(email, message.message_id);
        await refreshInboxCount();
      });
    }
  }

  return (
    <div className="inbox-list">
      {messages.map((m) => {
        const isRead = m.read || locallyRead.has(m.message_id);
        const isOpen = openId === m.message_id;
        return (
          <div className={`inbox-row ${isRead ? "" : "inbox-row-unread"}`} key={m.message_id}>
            <button
              type="button"
              className="inbox-row-header"
              onClick={() => toggle(m)}
              aria-expanded={isOpen}
              aria-controls={`inbox-body-${m.message_id}`}
            >
              <span className="inbox-avatar" aria-hidden>
                NB
              </span>
              <span className="inbox-row-main">
                <span className="inbox-row-top-line">
                  {!isRead && <span className="inbox-unread-dot" aria-label="Unread" />}
                  <span className="inbox-row-sender">The NBRH</span>
                  <span className="inbox-row-date">{relativeDate(m.sent_at)}</span>
                </span>
                <span className="inbox-row-subject">{m.title}</span>
                {!isOpen && <span className="inbox-row-preview">{preview(m.message)}</span>}
              </span>
            </button>
            {isOpen && (
              <div className="inbox-row-body" id={`inbox-body-${m.message_id}`}>
                <p>{m.message}</p>
                {m.link && (
                  <a href={m.link} className="btn btn-black" style={{ marginTop: 10 }}>
                    Open link
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
