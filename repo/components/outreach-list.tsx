"use client";

import { useMemo, useState } from "react";
import { SearchFilterBar, type FilterOption } from "./search-filter-bar";

export interface OutreachEntry {
  key: string; // stable React key
  searchText: string; // pre-flattened by the server page, e.g. "Jordan P. Hackney football"
  filterValues: Record<string, string>; // e.g. { area: "Hackney", sport: "football" } — plain strings, matched exactly against filter option values
  card: React.ReactNode; // the already-rendered EntryCard for this entry
}

interface OutreachListProps {
  entries: OutreachEntry[];
  placeholder: string;
  filters?: FilterOption[];
}

/**
 * Shared filtering shell for every Outreach subsection. IMPORTANT: this is a
 * Client Component, so every prop must be plain serialisable data — no
 * functions. Each server-component page does its own search-text
 * flattening and filter-value extraction (which it already needs to do to
 * render the card), and hands this component the *results* of that work,
 * not the logic itself. Filtering then happens here entirely against plain
 * strings.
 */
export function OutreachList({ entries, placeholder, filters }: OutreachListProps) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (term && !e.searchText.toLowerCase().includes(term)) return false;
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && e.filterValues[key] !== value) return false;
      }
      return true;
    });
  }, [entries, search, activeFilters]);

  return (
    <>
      <SearchFilterBar
        placeholder={placeholder}
        filters={filters}
        resultCount={filtered.length}
        onChange={(s, f) => {
          setSearch(s);
          setActiveFilters(f);
        }}
      />
      {filtered.length === 0 ? (
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", padding: "12px 0" }}>
          No results match your search or filters.
        </p>
      ) : (
        <div className="entry-list">{filtered.map((e) => e.card)}</div>
      )}
    </>
  );
}
