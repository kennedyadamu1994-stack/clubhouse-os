"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { NbrhUpdate } from "@/lib/types";
import { getNbrhUpdatesAction } from "@/lib/players/actions";

/**
 * "From The NBRH" bulletin board for Home. Originally (16 Sep) a
 * vertical stack of full-width bordered cards; rebuilt 17 Sep into a
 * horizontal carousel — one card in view at a time, manual navigation
 * only (Kennedy: no auto-advance).
 *
 * Card shape (18 Sep, Kennedy: "closer to a square instagram post,
 * with the image on top and the caption box below") — a square image
 * fills the top of a fixed-width card, the note/date/link sit below
 * it, same order as a real social post. The card went through two
 * earlier shapes before this: first a square image at 100% of the
 * card's own width (the card itself has no max-width — .main fills a
 * genuinely unbounded column by design — so "square" ended up several
 * hundred pixels tall), then a side-by-side image+text row to fix
 * that. Kennedy's follow-up asked for the Instagram-post shape
 * specifically, which needed the SLIDE itself capped to a fixed width
 * (not just the image) — see .nbrh-bulletin-slide's own comment in
 * globals.css for why that's the part that actually matters here.
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
 * carousel.tsx) uses. A transform-driven track needs JS to track touch
 * gestures for real swipe support; scroll-snap gets real touch-drag,
 * trackpad, and keyboard (arrow keys once focused) scrolling for free
 * from the browser, and the arrow buttons/dots here just call
 * scrollIntoView() on the target slide rather than computing a
 * transform — simpler and more robust than reimplementing swipe by
 * hand. handleScroll keeps the active dot in sync when the person
 * drags the track directly instead of using a button. Reduced motion
 * is respected in goTo() itself (behavior: "auto" instead of "smooth"
 * under prefers-reduced-motion), since scrollIntoView's animation is a
 * JS-driven scroll, not a CSS transition the global reduced-motion
 * rule in globals.css can intercept on its own.
 *
 * Arrows are rendered ONCE, as siblings of the track (flanking the
 * whole carousel row), not once per slide — simpler than overlaying a
 * specific card, and doesn't need touching again if the card's own
 * proportions change further.
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
        {updates.length > 1 && (
          <button
            className="nbrh-bulletin-arrow nbrh-bulletin-prev"
            onClick={() => goTo(index - 1, updates.length)}
            aria-label="Previous update"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}

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

        {updates.length > 1 && (
          <button
            className="nbrh-bulletin-arrow nbrh-bulletin-next"
            onClick={() => goTo(index + 1, updates.length)}
            aria-label="Next update"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        )}
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
