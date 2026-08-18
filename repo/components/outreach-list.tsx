"use client";

import { useMemo, useState } from "react";
import { SearchFilterBar, type FilterOption, type SortOption } from "./search-filter-bar";

export interface OutreachEntry {
  key: string; // stable React key
  searchText: string; // pre-flattened by the server page, e.g. "Jordan P. Hackney football"
  filterValues: Record<string, string>; // e.g. { area: "Hackney", sport: "football" } — plain strings, matched exactly against filter option values
  sortValues?: Record<string, number>; // e.g. { match: 72, name: 0 } — plain numbers the server already computed, used for sorting
  nameForSort?: string; // separate from searchText since search wants everything flattened, sort-by-name wants just the display name
  sponsored?: boolean; // pinned to the top of the list regardless of the active sort/filter (search and filters still apply normally)
  card: React.ReactNode; // the already-rendered EntryCard for this entry
}

interface OutreachListProps {
  entries: OutreachEntry[];
  placeholder: string;
  filters?: FilterOption[];
  sortOptions?: SortOption[]; // e.g. [{key:"match",label:"Best match"}, {key:"name",label:"Name (A–Z)"}]
  defaultSort?: string;
}

/**
 * Shared filtering/sorting shell for every Outreach subsection. IMPORTANT:
 * this is a Client Component, so every prop must be plain serialisable data
 * — no functions (a previous version broke on exactly this, see README).
 * Each server-component page pre-computes search text, filter values, and
 * sort values, then hands this component the *results*, not the logic.
 */
export function OutreachList({ entries, placeholder, filters, sortOptions, defaultSort }: OutreachListProps) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState(defaultSort ?? sortOptions?.[0]?.key ?? "");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = entries.filter((e) => {
      if (term && !e.searchText.toLowerCase().includes(term)) return false;
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && e.filterValues[key] !== value) return false;
      }
      return true;
    });

    // Sponsored entries are pinned to the top regardless of which sort is
    // active — search and filters still narrow the list normally, but once
    // an entry is in the filtered set, sponsored status is always the
    // primary sort key; whatever the person picked (best match, name A–Z,
    // or no sort at all) only decides ordering within each group.
    const bySponsored = (a: OutreachEntry, b: OutreachEntry) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0);

    if (sortKey === "name") {
      list = [...list].sort(
        (a, b) => bySponsored(a, b) || (a.nameForSort ?? "").localeCompare(b.nameForSort ?? ""),
      );
    } else if (sortKey) {
      list = [...list].sort(
        (a, b) => bySponsored(a, b) || (b.sortValues?.[sortKey] ?? -1) - (a.sortValues?.[sortKey] ?? -1),
      );
    } else {
      list = [...list].sort(bySponsored);
    }
    return list;
  }, [entries, search, activeFilters, sortKey]);

  return (
    <>
      <SearchFilterBar
        placeholder={placeholder}
        filters={filters}
        sortOptions={sortOptions}
        sortValue={sortKey}
        onSortChange={setSortKey}
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
