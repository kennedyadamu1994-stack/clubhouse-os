"use client";

import { useMemo, useState } from "react";
import { LoggedToggleButton } from "@/components/logged-toggle-button";
import type { ActionLogRow } from "@/lib/types";

/**
 * One request row, pre-resolved server-side (club name, action label, and
 * WHO/WHAT detail all need lookups against several other data sources —
 * done once in the page, not recomputed here). This client component only
 * handles filtering, sorting, and rendering.
 */
export interface ResolvedRequestRow {
  row: ActionLogRow;
  clubName: string;
  actionLabel: string;
  detail: string | null;
  formattedDate: string;
}

type SortKey = "newest" | "oldest" | "tokens_high" | "tokens_low";

const STATUS_LABEL: Record<ActionLogRow["status"], string> = {
  pending: "Pending",
  complete: "Complete",
  cancelled: "Cancelled",
};

/**
 * Filter and sort controls for the admin datalog (Kennedy's request, 25
 * Aug: "add filter and sort functionality that allows me to better
 * organise it when I'm using it"). Client-side only, same reasoning as
 * TrendingBoard — the full list is already loaded, no need to re-fetch to
 * filter/sort it.
 */
export function AdminRequestsBoard({ rows }: { rows: ResolvedRequestRow[] }) {
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ActionLogRow["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const clubOptions = useMemo(() => {
    const names = Array.from(new Set(rows.map((r) => r.clubName))).sort();
    return names;
  }, [rows]);

  const filteredSorted = useMemo(() => {
    let list = rows;
    if (clubFilter !== "all") list = list.filter((r) => r.clubName === clubFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.row.status === statusFilter);

    const sorted = [...list];
    if (sortBy === "newest") {
      sorted.sort((a, b) => b.row.created_at.localeCompare(a.row.created_at));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => a.row.created_at.localeCompare(b.row.created_at));
    } else if (sortBy === "tokens_high") {
      sorted.sort((a, b) => b.row.token_cost - a.row.token_cost);
    } else if (sortBy === "tokens_low") {
      sorted.sort((a, b) => a.row.token_cost - b.row.token_cost);
    }
    return sorted;
  }, [rows, clubFilter, statusFilter, sortBy]);

  return (
    <>
      <div className="admin-controls">
        <div className="admin-control-group">
          <span className="admin-control-label">Club</span>
          <select value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
            <option value="all">All clubs</option>
            {clubOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-control-group">
          <span className="admin-control-label">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ActionLogRow["status"] | "all")}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="admin-control-group">
          <span className="admin-control-label">Sort</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="tokens_high">Most tokens</option>
            <option value="tokens_low">Fewest tokens</option>
          </select>
        </div>
        <span className="admin-control-count">
          {filteredSorted.length} of {rows.length}
        </span>
      </div>

      {filteredSorted.length === 0 ? (
        <div className="card" style={{ color: "var(--dim)" }}>
          No requests match these filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredSorted.map(({ row, clubName, actionLabel, detail, formattedDate }) => (
            <div key={row.log_id} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-head)", fontSize: "1.05rem" }}>
                    {actionLabel}
                    {detail && <span style={{ color: "var(--pink)" }}> — {detail}</span>}
                  </div>
                  <div style={{ color: "var(--dim)", fontSize: "0.85rem", marginTop: 2 }}>
                    {clubName} · {formattedDate}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="badge">{STATUS_LABEL[row.status]}</span>
                  <span
                    className="badge"
                    style={{ color: "var(--text)", background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                  >
                    {row.token_cost === 0 ? "Free" : `${row.token_cost} token${row.token_cost === 1 ? "" : "s"}`}
                  </span>
                  {!row.notified && (
                    <span className="badge" style={{ color: "var(--pink)", borderColor: "var(--pink-line)" }}>
                      Not yet notified
                    </span>
                  )}
                  <LoggedToggleButton logId={row.log_id} status={row.status} />
                </div>
              </div>
              {row.notes && <p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{row.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
