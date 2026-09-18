"use client";

import { useState } from "react";

/** Entries revealed per "See more" click / hidden per "See less" click, and the initial page size — same constant as OutreachList (Kennedy, 1 Sep: "show the first 5... then have a see more button that expands it by 5 more"), applied here to every other plain list/grid in the app (Kennedy, 1 Sep follow-up: "every list in the OS"). */
const PAGE_SIZE = 5;

interface PaginatedListProps {
  /** Every item's pre-rendered card/row, in the order they should appear. */
  items: React.ReactNode[];
  /** Wraps the visible items — e.g. a grid div's className, or a plain fragment. Defaults to a plain flex column; pass the grid/list className already used by the page (e.g. "cardgrid perk-cardgrid") to preserve its existing layout. */
  className?: string;
}

/**
 * Show-5-then-"See more" pagination for any plain card list/grid that has
 * no search or filter state of its own (OutreachList already has its own
 * copy of this same mechanic, since it needs to reset the page on every
 * search/filter/sort change — this is the version for everything else:
 * Perks, Services, the admin directory, admin club balances). Same
 * PAGE_SIZE, same behaviour: reveals 5 more per "See more" click, and
 * "See less" hides back down to a minimum of 5.
 */
export function PaginatedList({ items, className }: PaginatedListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const canSeeMore = visibleCount < items.length;
  const canSeeLess = visibleCount > PAGE_SIZE;

  return (
    <>
      <div className={className ?? "entry-list"}>{items.slice(0, visibleCount)}</div>
      {(canSeeMore || canSeeLess) && (
        <div className="see-more-row">
          {canSeeMore && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setVisibleCount((v) => Math.min(v + PAGE_SIZE, items.length))}
            >
              See more
            </button>
          )}
          {canSeeLess && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setVisibleCount((v) => Math.max(v - PAGE_SIZE, PAGE_SIZE))}
            >
              See less
            </button>
          )}
        </div>
      )}
    </>
  );
}
