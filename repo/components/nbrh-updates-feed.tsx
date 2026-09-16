"use client";

import { useEffect, useState } from "react";
import type { NbrhUpdate } from "@/lib/types";
import { getNbrhUpdatesAction } from "@/lib/players/actions";

/**
 * "From The NBRH" feed for Home (15 Sep) — same real data, same
 * newest-first feed rendering CHOS's own dashboard already uses (see
 * app/dashboard/[clubToken]/page.tsx's own "From The NBRH" section,
 * which this mirrors exactly, including reusing its real nbrh-update*
 * CSS classes). Fetched via a Server Action (getNbrhUpdatesAction)
 * since Home is a client component and getNbrhUpdates() itself is a
 * server-side adapter call.
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
    <div className="nbrh-updates">
      {updates.map((u) => (
        <div className="nbrh-update" key={u.update_id}>
          <p className="nbrh-update-note">{u.note}</p>
          <div className="nbrh-update-meta">
            <span>
              {new Date(u.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {u.url && (
              <a href={u.url} target="_blank" rel="noopener noreferrer">
                Read more →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
