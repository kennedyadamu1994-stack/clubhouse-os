"use client";

import { NbrhEngine, type Category } from "@/components/nbrh-engine";
import { PlayerEntryCard } from "./player-entry-card";

/**
 * Thin client wrapper around NbrhEngine specifically so cardRenderer
 * (NbrhEngineProps, components/nbrh-engine.tsx) can be passed at all —
 * a function prop can't cross the server/client boundary from an async
 * server page directly (functions aren't serialisable in React Server
 * Components), so the actual <NbrhEngine cardRenderer={...} /> call has
 * to live inside a "use client" file. The Search pages themselves stay
 * server components (so they can read searchParams normally); this is
 * the one client piece they render instead of NbrhEngine directly.
 */
export function PlayerSearchEngine({
  initialCategory,
  initialSearch,
  linkBase,
}: {
  initialCategory?: Category;
  initialSearch?: string;
  linkBase: string;
}) {
  return (
    <NbrhEngine
      initialCategory={initialCategory}
      initialSearch={initialSearch}
      showPeople
      linkBase={linkBase}
      cardRenderer={(item) => <PlayerEntryCard item={item} />}
    />
  );
}
