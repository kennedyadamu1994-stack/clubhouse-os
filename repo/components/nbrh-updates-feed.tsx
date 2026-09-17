"use client";

import { useEffect, useState } from "react";
import { Megaphone, ArrowUpRight } from "lucide-react";
import type { NbrhUpdate } from "@/lib/types";
import { getNbrhUpdatesAction } from "@/lib/players/actions";

/**
 * "From The NBRH" bulletin board for Home (16 Sep rebuild, Kennedy:
 * "once some has signed in, The from the NBRH shows up, designed to be
 * eye catching. Acting as a bulletin board... Use bold text and icons
 * etc"). Same real data as before (getNbrhUpdatesAction, the same real
 * FROM THE NBRH sheet CHOS's own dashboard reads) — this rebuild only
 * changes the presentation: a bold, pink-accented Megaphone header
 * instead of a plain heading, each entry as its own bordered card
 * rather than a plain divided list, bolder note text, and a real
 * arrow-icon "Read more" link instead of plain text.
 *
 * Only rendered on Home once a player is actually signed in — the
 * caller (app/players/(browse)/page.tsx, app/players/[playerToken]/
 * page.tsx) is responsible for that gating, this component itself
 * doesn't check auth state.
 */
export function NbrhUpdatesFeed() {
  const [updates, setUpdates] = useState<NbrhUpdate[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNbrhUpdatesAction()
      .then((u) => {
        if (!cancelled) setUpdates(u);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p style={{ color: "var(--dim)", fontSize: "0.85rem" }}>Could not load updates right now.</p>;
  }

  if (!updates) {
    return (
      <div className="sr-loading">
        <div className="sr-spin" />
      </div>
    );
  }

  if (updates.length === 0) {
    return <p style={{ color: "var(--dim)", fontSize: "0.85rem" }}>No updates yet — check back soon.</p>;
  }

  return (
    <div className="nbrh-bulletin">
      <div className="nbrh-bulletin-header">
        <span className="nbrh-bulletin-icon" aria-hidden>
          <Megaphone size={20} strokeWidth={2} />
        </span>
        <div>
          <h2 className="nbrh-bulletin-title">From The NBRH</h2>
          <p className="nbrh-bulletin-sub">The latest, straight from us</p>
        </div>
      </div>

      <div className="nbrh-bulletin-list">
        {updates.map((u) => (
          <div className="nbrh-bulletin-card" key={u.update_id}>
            <p className="nbrh-bulletin-note">{u.note}</p>
            <div className="nbrh-bulletin-meta">
              <span>
                {new Date(u.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {u.url && (
                <a href={u.url} target="_blank" rel="noopener noreferrer" className="nbrh-bulletin-link">
                  Read more
                  <ArrowUpRight size={13} aria-hidden />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
