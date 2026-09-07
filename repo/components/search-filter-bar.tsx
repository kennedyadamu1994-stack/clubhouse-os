"use client";

import { useMemo, useState } from "react";

export interface FilterOption {
  key: string;
  label: string;
  values: string[]; // unique values already present in this section's data
}

export interface SortOption {
  key: string;
  label: string;
}

interface SearchFilterBarProps {
  placeholder: string;
  filters?: FilterOption[];
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (key: string) => void;
  onChange: (search: string, activeFilters: Record<string, string>) => void;
  resultCount: number;
}

/**
 * Search + filter + sort toolbar, one per Outreach subsection — same
 * pattern as the NBRH Engine's toolbar. Filtering/sorting itself happens in
 * the parent's data via the callbacks; this component only tracks UI state
 * and reports it up (never owns the actual list).
 */
export function SearchFilterBar({
  placeholder,
  filters = [],
  sortOptions,
  sortValue,
  onSortChange,
  onChange,
  resultCount,
}: SearchFilterBarProps) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCount = useMemo(() => Object.values(active).filter(Boolean).length, [active]);

  function update(nextSearch: string, nextActive: Record<string, string>) {
    setSearch(nextSearch);
    setActive(nextActive);
    onChange(nextSearch, nextActive);
  }

  return (
    <div className="subtoolbar">
      <div className="askbar">
        <span className="ic" aria-hidden>
          ⌕
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => update(e.target.value, active)}
          aria-label="Search this list"
        />
      </div>

      {filters.length > 0 && (
        <div style={{ position: "relative" }}>
          <button className="btn btn-ghost" onClick={() => setFilterOpen((v) => !v)} aria-expanded={filterOpen}>
            Filter{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
          {filterOpen && (
            <div className="filter-popover" role="group" aria-label="Filters">
              {filters.map((f) => (
                <label key={f.key} className="filter-field">
                  <span className="hint">{f.label}</span>
                  <select
                    value={active[f.key] ?? ""}
                    onChange={(e) => update(search, { ...active, [f.key]: e.target.value })}
                  >
                    <option value="">Any</option>
                    {f.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              {activeCount > 0 && (
                <button className="btn btn-ghost" onClick={() => update(search, {})} style={{ width: "100%" }}>
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {sortOptions && sortOptions.length > 0 && (
        <label className="sort-select-wrap">
          <span className="hint" style={{ marginRight: 6 }}>
            Sort
          </span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange?.(e.target.value)}
            aria-label="Sort results"
          >
            {sortOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <span className="count-badge" style={{ marginLeft: "auto" }}>
        {resultCount} result{resultCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
