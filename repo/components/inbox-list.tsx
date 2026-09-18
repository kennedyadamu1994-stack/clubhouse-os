"use client";

import { useState, useTransition } from "react";
import { markInboxRead } from "@/lib/actions";
import type { InboxMessage } from "@/lib/types";

/**
 * Club-facing Inbox, redesigned to read like an actual email inbox
 * (Kennedy's request, 27 Aug third follow-up: "make the Inbox look more
 * like an email inbox... right now it looks very unprofessional") rather
 * than a generic accordion list. Chronological order (oldest first, per
 * Kennedy's earlier explicit instruction), each message expandable to
 * read in full — opening a message marks it read via the markInboxRead
 * server action, persisted server-side (see lib/data/postgres.ts's
 * inbox_reads table) so the unread state survives a refresh, a new
 * session, or a different device.
 *
 * What makes this read as an inbox rather than an accordion:
 *   - a sender avatar (reuses .entry-avatar, the same visual language
 *     every other list in this app already uses for an entity's image
 *     slot — here it's always "NBRH" since every message comes from the
 *     same sender)
 *   - unread rows are bold with a filled dot, read rows are regular
 *     weight and visually quieter — the actual signal an email client
 *     gives, not just a small dot
 *   - a one-line preview of the message body under the title when
 *     collapsed, so the row isn't just a bare subject line
 *   - relative dates (Today, Yesterday, or a short date) rather than
 *     always spelling out the full date — how every real inbox does it
 *
 * A dedicated component rather than reusing EntryCard/OutreachList — a
 * message thread has different interaction needs (unread visual weight,
 * expand-to-read-and-mark-read) than an outreach entry (view details,
 * take an action), so forcing it into that shape would fight the pattern
 * rather than fit it.
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
