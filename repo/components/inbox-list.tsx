"use client";

import { useState, useTransition } from "react";
import { markInboxRead } from "@/lib/actions";
import type { InboxMessage } from "@/lib/types";

/**
 * New club-facing Inbox (Kennedy's request, 27 Aug). Chronological list
 * (oldest first, per Kennedy's explicit instruction), each message
 * expandable to read the full body — opening a message marks it read via
 * the markInboxRead server action, persisted server-side (see
 * lib/data/postgres.ts's inbox_reads table) so the unread state survives
 * a refresh, a new session, or a different device.
 *
 * A dedicated component rather than reusing EntryCard/OutreachList — a
 * message thread has different interaction needs (unread visual weight,
 * expand-to-read-and-mark-read) than an outreach entry (view details,
 * take an action), so forcing it into that shape would fight the pattern
 * rather than fit it.
 */
export function InboxList({
  clubToken,
  club_id,
  messages,
}: {
  clubToken: string;
  club_id: string;
  messages: (InboxMessage & { read: boolean })[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggle(message: InboxMessage & { read: boolean }) {
    const isOpen = openId === message.message_id;
    setOpenId(isOpen ? null : message.message_id);
    if (!isOpen && !message.read && !locallyRead.has(message.message_id)) {
      // Optimistic — the badge/row updates immediately rather than waiting
      // on the round trip, then the server action persists it for real.
      setLocallyRead((prev) => new Set(prev).add(message.message_id));
      startTransition(() => {
        markInboxRead(clubToken, club_id, message.message_id);
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
              {!isRead && <span className="inbox-unread-dot" aria-label="Unread" />}
              <span className="inbox-row-subject">{m.subject}</span>
              <span className="inbox-row-date">
                {new Date(m.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </button>
            {isOpen && (
              <div className="inbox-row-body" id={`inbox-body-${m.message_id}`}>
                <p>{m.body}</p>
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
