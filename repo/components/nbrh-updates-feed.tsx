"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone, ArrowUpRight } from "lucide-react";
import type { NbrhUpdate } from "@/lib/types";
import { getNbrhUpdatesAction } from "@/lib/players/actions";

/**
 * "From The NBRH" bulletin board for Home. Originally (16 Sep) a
 * vertical stack of full-width bordered cards; rebuilt 17 Sep into a
 * horizontal carousel of Instagram-post-shaped cards (square image on
 * top, caption below) — see globals.css's own comments on
 * .nbrh-bulletin-slide/-card for that shape's history.
 *
 * 18 Sep follow-up (Kennedy: "same height, a little wider, remove the
 * arrows") — three changes from the previous version:
 *   - Arrows removed entirely. Navigation is scroll-snap only now:
 *     touch-drag, trackpad, and keyboard (the track is a scrollable
 *     region, reachable and scrollable by keyboard same as any
 *     overflow: auto container) all still work: only the two explicit
 *     buttons are gone. The dots stay as the one remaining explicit
 *     control (still call goTo(), unchanged).
 *   - Slide width increased (see .nbrh-bulletin-slide in globals.css).
 *   - Cards now a fixed total height, not just a fixed-width square
 *     image with a variable-height caption below it — .nbrh-bulletin-
 *     note is clamped to 2 lines (-webkit-line-clamp, the same
 *     pattern already used in several other places in this file) so a
 *     long note truncates instead of making its own card taller than
 *     its neighbours.
 *
 * Data source: getNbrhUpdatesAction now reads POS's own genuinely
 * separate "P FROM THE NBRH" tab (see lib/players/actions.ts and
 * lib/data/sheets.ts's getPlayerNbrhUpdates), not CHOS's "FROM THE
 * NBRH" tab — the function name here is unchanged, only what it reads
 * server-side changed, so this component didn't need touching for
 * that part.
 *
 * Mechanics: CSS scroll-snap on a native overflow-x scroller, not the
 * translateX-track pattern HeaderCarousel (components/header-
 * carousel.tsx) uses. scroll-snap gets real touch-drag, trackpad, and
 * keyboard scrolling for free from the browser; the dots here call
 * scrollIntoView() on the target slide rather than computing a
 * transform. handleScroll keeps the active dot in sync when the
 * person scrolls/drags the track directly instead of using a dot.
 * Reduced motion is respected in goTo() itself (behavior: "auto"
 * instead of "smooth" under prefers-reduced-motion), since
 * scrollIntoView's animation is a JS-driven scroll, not a CSS
 * transition the global reduced-motion rule in globals.css can
 * intercept on its own.
 *
 * Only rendered on Home once a player is actually signed in — the
 * caller (app/players/(browse)/page.tsx, app/players/[playerToken]/
 * page.tsx) is responsible for that gating, this component itself
 * doesn't check auth state.
 */
export function NbrhUpdatesFeed() {
  const [updates, setUpdates] = useState<NbrhUpdate[] | null>(null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  const goTo = useCallback((i: number, len: number) => {
    const clamped = ((i % len) + len) % len;
    setIndex(clamped);
    const track = trackRef.current;
    if (track) {
      const slide = track.children[clamped] as HTMLElement | undefined;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      slide?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
    }
  }, []);

  // Keeps the dot/aria state in sync when the person scrolls or swipes
  // the track directly rather than using the arrow buttons — otherwise
  // goTo() would be the only way the active dot ever updates.
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || !updates) return;
    const slideWidth = track.clientWidth;
    if (slideWidth === 0) return;
    const nearest = Math.round(track.scrollLeft / slideWidth);
    setIndex(Math.min(Math.max(nearest, 0), updates.length - 1));
  }, [updates]);

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

      <div
        className="nbrh-bulletin-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="From The NBRH updates"
      >
        <div className="nbrh-bulletin-track" ref={trackRef} onScroll={handleScroll}>
          {updates.map((u) => (
            <div className="nbrh-bulletin-slide" key={u.update_id}>
              <div className="nbrh-bulletin-card">
                {/* Always rendered, even with no imageUrl (a real, common
                    case in the seed/live data — not every update has a
                    photo) — .nbrh-bulletin-image-wrap reserves the same
                    fixed-size square footprint either way. */}
                <div className="nbrh-bulletin-image-wrap">
                  {u.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- per-entry external image from the real sheet, not a static asset
                    <img src={u.imageUrl} alt="" className="nbrh-bulletin-image" />
                  )}
                </div>
                <div className="nbrh-bulletin-body">
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {updates.length > 1 && (
        <div className="nbrh-bulletin-dots" role="tablist" aria-label="Choose update">
          {updates.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Update ${i + 1} of ${updates.length}`}
              className={`nbrh-bulletin-dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i, updates.length)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
