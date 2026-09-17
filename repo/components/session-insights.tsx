"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Session Insights — platform-wide session data (price, ratings, capacity,
 * popularity) across every NBRH session. NOT club-scoped: every club sees
 * the same numbers, because this describes the whole platform, not any
 * one club's row. That's why it fetches client-side from a public sheet
 * endpoint directly, rather than through lib/data's server-side adapter —
 * lib/data exists specifically to enforce per-club scoping (CLAUDE.md rule
 * 1), and there's no club data here to scope. Kept as its own clearly
 * separate data path rather than silently folding it into that layer.
 *
 * Ported from a standalone HTML/JS tool Kennedy already had built and
 * running elsewhere — the card-building logic below is a faithful port of
 * that tool's own logic, restyled onto this app's CSS variables (its
 * --pk/--bg3/--t2/etc. map onto --pink/--surface-2/--dim/etc. here) rather
 * than shipping a second design system alongside this one.
 */

const SHEET_ID = "1v2ve0B1MWKQPu0CRIgl4jhtHRk88MoEA04T6IfhPE_o";
const SHEET_TAB = "Core Sessions";
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(SHEET_TAB)}`;

type Row = Record<string, string>;

const pn = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[£$,\s%]/g, ""));
  return isNaN(n) ? null : n;
};
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0);
const fmt = (n: number | null | undefined, d = 0) =>
  n == null || isNaN(n) ? "—" : Number(n).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const gbp = (n: number | null | undefined) =>
  n == null || isNaN(n) || n === 0 ? "—" : `£${Number(n).toFixed(2)}`;
const p1 = (n: number, w: string) => `${n} ${w}${n !== 1 ? "s" : ""}`;
const DIRTY = /^(unknown|n\/a|none|prefer not to say|not specified|other|-|tbc|tbd)$/i;
const clean = (v: unknown): string | null => {
  if (!v) return null;
  const s = String(v).trim();
  return !s || DIRTY.test(s) ? null : s;
};

function countBy(arr: Row[], fn: (r: Row) => unknown): [string, number][] {
  const m: Record<string, number> = {};
  arr.forEach((r) => {
    const k = clean(fn(r));
    if (k) m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function avgBy(arr: Row[], kFn: (r: Row) => unknown, vFn: (r: Row) => number | null) {
  const m: Record<string, { s: number; n: number }> = {};
  arr.forEach((r) => {
    const k = clean(kFn(r));
    const v = vFn(r);
    if (k && v != null) {
      if (!m[k]) m[k] = { s: 0, n: 0 };
      m[k].s += v;
      m[k].n++;
    }
  });
  return Object.entries(m)
    .map(([key, { s, n }]) => ({ key, avg: s / n, n }))
    .sort((a, b) => b.avg - a.avg);
}

const F = {
  activity: (r: Row) => r["Activity Type"],
  location: (r: Row) => r["Location"],
  basePrice: (r: Row) => pn(r["Base Price (£)"]),
  audience: (r: Row) => r["Audience"],
  userRating: (r: Row) => pn(r["User Rating"]),
  duration: (r: Row) => pn(r["Duration (minutes)"]),
  days: (r: Row) => r["Days"],
  status: (r: Row) => r["Session Status"],
  difficulty: (r: Row) => r["Difficulty Level"],
  spots: (r: Row) => pn(r["Spots Available"]),
  totalSpots: (r: Row) => pn(r["Total Spots"]),
  sportsman: (r: Row) => pn(r["Sportsmanship Score"]),
  friendly: (r: Row) => pn(r["Friendliness Score"]),
  org: (r: Row) => pn(r["Organisation Score"]),
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function extractDays(data: Row[]): string[] {
  const found = new Set<string>();
  data.forEach((r) => {
    const d = F.days(r);
    if (!d) return;
    String(d)
      .split(/[,/&]|\band\b/i)
      .forEach((part) => {
        const s = part.trim();
        if (!s) return;
        DAY_ORDER.forEach((day) => {
          if (day.toLowerCase().startsWith(s.toLowerCase().slice(0, 3))) found.add(day);
        });
      });
  });
  return DAY_ORDER.filter((d) => found.has(d));
}
function sessionHasDay(r: Row, dayName: string) {
  const d = String(F.days(r) || "").toLowerCase();
  return d.includes(dayName.toLowerCase().slice(0, 3));
}

type FilterMode = "all" | "sport" | "borough" | "day";

/** Rank card with an optional top/bottom toggle — the tool's signature interaction. */
function RankCard({
  label,
  topTitle,
  topSub,
  topRows,
  bottomTitle,
  bottomSub,
  bottomRows,
}: {
  label: string;
  topTitle: string;
  topSub: React.ReactNode;
  topRows: [string, string][];
  bottomTitle?: string;
  bottomSub?: React.ReactNode;
  bottomRows?: [string, string][] | null;
}) {
  const [dir, setDir] = useState<"top" | "btm">("top");
  const hasToggle = !!(bottomRows && bottomRows.length > 0);
  const rows = (dir === "top" ? topRows : bottomRows) ?? topRows;
  const title = dir === "top" ? topTitle : bottomTitle ?? topTitle;
  const sub = dir === "top" ? topSub : bottomSub ?? topSub;

  return (
    <div className="si-card">
      {hasToggle ? (
        <div className="si-ch">
          <span className="si-lbl">{label}</span>
          <div className="si-tb-pill">
            <button className={`si-tb-btn ${dir === "top" ? "active" : ""}`} onClick={() => setDir("top")}>
              Top ↑
            </button>
            <button className={`si-tb-btn ${dir === "btm" ? "active" : ""}`} onClick={() => setDir("btm")}>
              Bottom ↓
            </button>
          </div>
        </div>
      ) : (
        <span className="si-lbl">{label}</span>
      )}
      <div className="si-word" style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", marginBottom: "0.3rem" }}>
        {title}
      </div>
      <div className="si-sub">{sub}</div>
      <div className="si-rl">
        {rows.slice(0, 5).map(([k, v], i) => (
          <div className="si-rr" key={k}>
            <span className="si-rn">{i + 1}</span>
            <span className="si-rname" title={k}>
              {k}
            </span>
            <span className="si-rval">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HalfCard({
  label,
  num,
  sub,
  body,
  glow,
}: {
  label: string;
  num: string;
  sub: React.ReactNode;
  body?: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div className={`si-card ${glow ? "si-gl" : ""}`}>
      <span className="si-lbl">{label}</span>
      <div className="si-num-md">{num}</div>
      <div className="si-sub">{sub}</div>
      {body && <p className="si-body">{body}</p>}
    </div>
  );
}

export function SessionInsights() {
  const [allData, setAllData] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAllData(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load session data. Check your connection and try refreshing.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeData = useMemo(() => (allData ?? []).filter((r) => !/inactive/i.test(F.status(r) || "")), [allData]);

  const filtered = useMemo(() => {
    if (filterMode === "sport" && filterValue) {
      return activeData.filter((r) => (clean(F.activity(r)) || "").toLowerCase() === filterValue.toLowerCase());
    }
    if (filterMode === "borough" && filterValue) {
      return activeData.filter((r) => (clean(F.location(r)) || "").toLowerCase() === filterValue.toLowerCase());
    }
    if (filterMode === "day" && filterValue) {
      return activeData.filter((r) => sessionHasDay(r, filterValue));
    }
    return activeData;
  }, [activeData, filterMode, filterValue]);

  const selectOptions = useMemo(() => {
    if (filterMode === "sport") return countBy(activeData, (r) => F.activity(r));
    if (filterMode === "borough") return countBy(activeData, (r) => F.location(r));
    if (filterMode === "day") {
      return extractDays(activeData).map((d) => [d, activeData.filter((r) => sessionHasDay(r, d)).length] as [string, number]);
    }
    return [];
  }, [activeData, filterMode]);

  function setMode(mode: FilterMode) {
    setFilterMode(mode);
    setFilterValue("");
  }

  if (error) {
    return (
      <div className="si-card-hero">
        <span className="si-lbl">Error</span>
        <p className="si-body">{error}</p>
      </div>
    );
  }

  if (!allData) {
    return (
      <div className="si-loading">
        <div className="si-spin" />
        <p style={{ color: "var(--faint-text)", fontSize: "0.85rem" }}>Pulling session data…</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <>
        <SessionFilterBar
          filterMode={filterMode}
          filterValue={filterValue}
          selectOptions={selectOptions}
          onModeChange={setMode}
          onValueChange={setFilterValue}
        />
        <div className="si-empty">
          <strong>No sessions found</strong>
          No active sessions match this filter. Try a different option.
        </div>
      </>
    );
  }

  return (
    <>
      <SessionFilterBar
        filterMode={filterMode}
        filterValue={filterValue}
        selectOptions={selectOptions}
        onModeChange={setMode}
        onValueChange={setFilterValue}
      />
      <SessionCards data={filtered} filterMode={filterMode} filterValue={filterValue} />
    </>
  );
}

function SessionFilterBar({
  filterMode,
  filterValue,
  selectOptions,
  onModeChange,
  onValueChange,
}: {
  filterMode: FilterMode;
  filterValue: string;
  selectOptions: [string, number][];
  onModeChange: (m: FilterMode) => void;
  onValueChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
      <div className="si-toggle-pill">
        <button className={filterMode === "all" ? "active" : ""} onClick={() => onModeChange("all")}>
          All sessions
        </button>
        <button className={filterMode === "sport" ? "active" : ""} onClick={() => onModeChange("sport")}>
          By sport
        </button>
        <button className={filterMode === "borough" ? "active" : ""} onClick={() => onModeChange("borough")}>
          By borough
        </button>
        <button className={filterMode === "day" ? "active" : ""} onClick={() => onModeChange("day")}>
          By day
        </button>
      </div>

      {filterMode !== "all" && (
        <div className="si-select-wrap">
          <select value={filterValue} onChange={(e) => onValueChange(e.target.value)} aria-label={`Choose a ${filterMode}`}>
            <option value="">Select…</option>
            {selectOptions.map(([k, v]) => (
              <option key={k} value={k}>
                {k} ({v})
              </option>
            ))}
          </select>
        </div>
      )}

      <span className="si-filter-label">
        {filterMode === "all" ? "All sessions" : filterValue ? `${filterMode === "sport" ? "Sport" : filterMode === "borough" ? "Borough" : "Day"}: ${filterValue}` : "Choose an option above"}
      </span>
    </div>
  );
}

function SessionCards({ data, filterMode, filterValue }: { data: Row[]; filterMode: FilterMode; filterValue: string }) {
  const tot = data.length;
  const px = data.map((r) => F.basePrice(r)).filter((p): p is number => p != null);
  const freeN = px.filter((p) => p === 0).length;
  const paidPx = px.filter((p) => p > 0);
  const rats = data.map((r) => F.userRating(r)).filter((v): v is number => v != null && v > 0);
  const durs = data.map((r) => F.duration(r)).filter((v): v is number => v != null && v > 0);
  const actC = countBy(data, (r) => F.activity(r));
  const borC = countBy(data, (r) => F.location(r));
  const dayC = countBy(data, (r) => F.days(r));
  const actRats = avgBy(data, (r) => F.activity(r), (r) => F.userRating(r)).filter((x) => x.n >= 2 && x.avg > 0);
  const borRats = avgBy(data, (r) => F.location(r), (r) => F.userRating(r)).filter((x) => x.n >= 2 && x.avg > 0);
  const durByAct = avgBy(data, (r) => F.activity(r), (r) => F.duration(r)).filter((x) => x.avg > 0);
  const priceByAct = avgBy(data, (r) => F.activity(r), (r) => {
    const p = F.basePrice(r);
    return p != null && p > 0 ? p : null;
  }).filter((x) => x.avg > 0);
  const spotsArr = data.map((r) => F.spots(r)).filter((v): v is number => v != null && v >= 0);
  const totalSpotsArr = data.map((r) => F.totalSpots(r)).filter((v): v is number => v != null && v > 0);
  const avgSpots = mean(spotsArr);
  const totalAvail = spotsArr.reduce((a, b) => a + b, 0);
  const withSpace = spotsArr.filter((v) => v > 0).length;

  const avgRating = mean(rats);
  const avgPaid = mean(paidPx);
  const avgPrice = mean(px);
  const avgDur = mean(durs);
  const freePct = pct(freeN, tot);
  const topAct = actC[0] || ["—", 0];
  const topBor = borC[0] || ["—", 0];
  const busyDay = dayC[0] || ["—", 0];
  const quietDay = dayC.length > 1 ? dayC[dayC.length - 1] : null;
  const topRated = actRats[0];

  const isSportFilter = filterMode === "sport" && !!filterValue;
  const isBoroughFilter = filterMode === "borough" && !!filterValue;
  const isDayFilter = filterMode === "day" && !!filterValue;
  const contextStr = isSportFilter ? (
    <>
      for <strong>{filterValue}</strong> sessions
    </>
  ) : isBoroughFilter ? (
    <>
      in <strong>{filterValue}</strong>
    </>
  ) : isDayFilter ? (
    <>
      on <strong>{filterValue}s</strong>
    </>
  ) : (
    "across the platform"
  );

  const subRaw: [string, number][] = [
    ["Sportsmanship", mean(data.map((r) => F.sportsman(r)).filter((v): v is number => v != null && v > 0))] as [string, number],
    ["Friendliness", mean(data.map((r) => F.friendly(r)).filter((v): v is number => v != null && v > 0))] as [string, number],
    ["Organisation", mean(data.map((r) => F.org(r)).filter((v): v is number => v != null && v > 0))] as [string, number],
  ].filter(([, v]) => v > 0);
  const bestSub = subRaw.length ? [...subRaw].sort((a, b) => b[1] - a[1])[0] : null;
  const worstSub = subRaw.length > 1 ? [...subRaw].sort((a, b) => a[1] - b[1])[0] : null;

  const audC = countBy(data, (r) => F.audience(r));
  const difC = countBy(data, (r) => F.difficulty(r));
  const topAud = audC[0] || ["—", 0];
  const topDif = difC[0] || ["—", 0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Hero */}
      <div className="si-card-hero">
        <span className="si-lbl">
          {isSportFilter ? `${filterValue.toUpperCase()} SESSIONS` : isBoroughFilter ? `${filterValue.toUpperCase()} OVERVIEW` : isDayFilter ? `${filterValue.toUpperCase()} SESSIONS` : "THE SESSIONS"}
        </span>
        <div className="si-num">{fmt(tot)}</div>
        <div className="si-sub">
          active session{tot !== 1 ? "s" : ""} available {contextStr} right now.
        </div>
        <p className="si-body">
          {isSportFilter ? (
            <>
              <strong>{filterValue}</strong> sessions are live across <strong>{p1(borC.length, "borough")}</strong>.{" "}
              {borC.length > 0 && (
                <>
                  The most active area for this sport is <strong>{topBor[0]}</strong> with <strong>{p1(topBor[1], "session")}</strong>.
                </>
              )}
            </>
          ) : isBoroughFilter ? (
            <>
              <strong>{filterValue}</strong> has <strong>{p1(actC.length, "different activity")}</strong> available.{" "}
              {actC.length > 0 && (
                <>
                  The most popular is <strong>{topAct[0]}</strong> with <strong>{p1(topAct[1], "session")}</strong>.
                </>
              )}
            </>
          ) : isDayFilter ? (
            <>
              On <strong>{filterValue}s</strong>, there are <strong>{p1(actC.length, "different activity")}</strong> to choose from across{" "}
              <strong>{p1(borC.length, "borough")}</strong>. The most popular on this day is <strong>{topAct[0]}</strong>.
            </>
          ) : (
            <>
              The NBRH is live across <strong>{p1(borC.length, "borough")}</strong> with <strong>{actC.length} different activities</strong> to
              choose from. The most active borough right now is <strong>{topBor[0]}</strong> with <strong>{p1(topBor[1], "session")}</strong>{" "}
              available.
            </>
          )}
        </p>
      </div>

      {/* Access + Most popular */}
      <div className="si-grid">
        <HalfCard
          label="Access for all"
          num={`${freePct}%`}
          sub={<>of sessions {contextStr} are completely free.</>}
          body={
            <>
              That&apos;s <strong>{p1(freeN, "session")}</strong> you can book without spending a penny.{" "}
              {paidPx.length > 0 && (
                <>
                  For paid sessions, the average price is <strong>{gbp(avgPaid)}</strong>.
                </>
              )}
            </>
          }
          glow
        />
        {isSportFilter ? (
          <RankCard
            label="Where to find it"
            topTitle={topBor[0]}
            topSub={<>has the most {filterValue} sessions on the platform.</>}
            topRows={borC.slice(0, 5).map(([k, v]) => [k, p1(v, "session")])}
            bottomTitle={borC.length > 1 ? borC[borC.length - 1][0] : "—"}
            bottomSub="has the fewest, consider it if you want a quieter session."
            bottomRows={borC.length > 1 ? [...borC].reverse().slice(0, 5).map(([k, v]) => [k, p1(v, "session")]) : null}
          />
        ) : (
          <RankCard
            label="Most popular"
            topTitle={topAct[0]}
            topSub={<>leads with {p1(topAct[1], "session")}, here&apos;s the full top five.</>}
            topRows={actC.slice(0, 5).map(([k, v]) => [k, p1(v, "session")])}
            bottomTitle={actC.length > 1 ? actC[actC.length - 1][0] : "—"}
            bottomSub="is the most niche offering, fewer sessions, but they exist."
            bottomRows={actC.length > 1 ? [...actC].reverse().slice(0, 5).map(([k, v]) => [k, p1(v, "session")]) : null}
          />
        )}
      </div>

      {/* Community voice + When to play */}
      <div className="si-grid">
        <HalfCard
          label="Community voice"
          num={rats.length ? `${fmt(avgRating, 1)}/10` : "—"}
          sub={rats.length ? <>average rating across {p1(rats.length, "rated session")} {contextStr}.</> : <>No ratings yet {contextStr}.</>}
          body={
            <>
              {topRated && !isSportFilter && (
                <>
                  <strong>{topRated.key}</strong> is the highest-rated activity at <strong>{fmt(topRated.avg, 1)}/10</strong>.{" "}
                </>
              )}
              {bestSub && (
                <>
                  Sub-scores show <strong>{bestSub[0]}</strong> is where sessions shine most (avg <strong>{fmt(bestSub[1], 1)}</strong>).{" "}
                  {worstSub && (
                    <>
                      <strong>{worstSub[0]}</strong> has the most room to grow.
                    </>
                  )}
                </>
              )}
            </>
          }
          glow
        />
        <HalfCard
          label="When to play"
          num={busyDay[0]}
          sub={<>is the most active day with {p1(busyDay[1], "session")} {contextStr}.</>}
          body={
            quietDay && (
              <>
                If you prefer more space, <strong>{quietDay[0]}</strong> is the quietest, just <strong>{p1(quietDay[1], "session")}</strong> means
                fewer people and more room to focus.
              </>
            )
          }
        />
      </div>

      {/* Quality + Who it's for */}
      <div className="si-grid">
        {isBoroughFilter ? (
          actRats.length >= 2 ? (
            <RankCard
              label="Top activities here"
              topTitle={actRats[0].key}
              topSub={<>is the highest-rated activity in {filterValue} at {fmt(actRats[0].avg, 1)}/10.</>}
              topRows={actRats.slice(0, 5).map((x) => [x.key, `${fmt(x.avg, 1)}/10 avg`])}
              bottomTitle={actRats[actRats.length - 1].key}
              bottomSub="has the most room for improvement here."
              bottomRows={[...actRats].reverse().slice(0, 5).map((x) => [x.key, `${fmt(x.avg, 1)}/10 avg`])}
            />
          ) : (
            <HalfCard
              label="Most popular activity"
              num={topAct[0]}
              sub={<>leads in {filterValue} with {p1(topAct[1], "session")}.</>}
            />
          )
        ) : borRats.length >= 3 ? (
          <RankCard
            label="Where quality lives"
            topTitle={borRats[0].key}
            topSub={<>is the highest-rated borough{isSportFilter ? <> for {filterValue}</> : null} at {fmt(borRats[0].avg, 1)}/10.</>}
            topRows={borRats.slice(0, 5).map((x) => [x.key, `${fmt(x.avg, 1)}/10 avg`])}
            bottomTitle={borRats[borRats.length - 1].key}
            bottomSub="has the lowest average rating, still active, but with room to grow."
            bottomRows={[...borRats].reverse().slice(0, 5).map((x) => [x.key, `${fmt(x.avg, 1)}/10 avg`])}
          />
        ) : (
          <HalfCard label="Top borough" num={topBor[0]} sub={<>leads with {p1(topBor[1], "session")} available.</>} />
        )}

        <HalfCard
          label="Who it's for"
          num={topAud[0] !== "—" ? topAud[0] : topDif[0] !== "—" ? topDif[0] : fmt(tot)}
          sub={topAud[0] !== "—" ? <>the most represented audience {contextStr}.</> : <>the most common difficulty level.</>}
          body={
            <>
              {topAud[0] !== "—" && (
                <>
                  <strong>{pct(topAud[1], tot)}%</strong> of sessions here are listed for <strong>{topAud[0]}</strong>.{" "}
                </>
              )}
              {topDif[0] !== "—" && (
                <>
                  The most common difficulty is <strong>{topDif[0]}</strong>.
                </>
              )}
            </>
          }
          glow
        />
      </div>

      {/* Session length + Capacity */}
      <div className="si-grid">
        {durByAct.length >= 2 ? (
          <RankCard
            label="Session length"
            topTitle={durByAct[0].key}
            topSub={<>runs the longest on average, {Math.round(durByAct[0].avg)} mins per session.</>}
            topRows={durByAct.map((x) => [x.key, `${Math.round(x.avg)} mins avg`])}
            bottomTitle={durByAct[durByAct.length - 1].key}
            bottomSub={<>is the shortest on average at {Math.round(durByAct[durByAct.length - 1].avg)} mins, ideal if you&apos;re short on time.</>}
            bottomRows={[...durByAct].reverse().map((x) => [x.key, `${Math.round(x.avg)} mins avg`])}
          />
        ) : (
          <HalfCard
            label="Session length"
            num={durs.length ? `${fmt(Math.round(avgDur))} mins` : "—"}
            sub={<>average session duration {contextStr}.</>}
          />
        )}
        <HalfCard
          label="Capacity & space"
          num={spotsArr.length ? fmt(Math.round(avgSpots)) : "—"}
          sub={<>average spots available per session {contextStr}.</>}
          body={
            spotsArr.length > 0 && (
              <>
                There are <strong>{fmt(totalAvail)} spots</strong> open right now.{" "}
                {withSpace > 0 && (
                  <>
                    <strong>{pct(withSpace, spotsArr.length)}%</strong> of sessions still have room.{" "}
                  </>
                )}
                {totalSpotsArr.length > 0 && (
                  <>
                    Total platform capacity sits at <strong>{fmt(totalSpotsArr.reduce((a, b) => a + b, 0))} spots</strong>.
                  </>
                )}
              </>
            )
          }
          glow
        />
      </div>

      {/* Price breakdown */}
      {priceByAct.length >= 2 ? (
        <RankCard
          label="Price breakdown"
          topTitle={[...priceByAct].sort((a, b) => a.avg - b.avg)[0].key}
          topSub={<>is the most affordable paid activity, averaging just {gbp([...priceByAct].sort((a, b) => a.avg - b.avg)[0].avg)} per session.</>}
          topRows={[...priceByAct].sort((a, b) => a.avg - b.avg).map((x) => [x.key, `${gbp(x.avg)} avg`])}
          bottomTitle={[...priceByAct].sort((a, b) => b.avg - a.avg)[0].key}
          bottomSub="is the priciest paid activity."
          bottomRows={[...priceByAct].sort((a, b) => b.avg - a.avg).map((x) => [x.key, `${gbp(x.avg)} avg`])}
        />
      ) : (
        <HalfCard
          label="Pricing"
          num={gbp(avgPrice)}
          sub={<>average session price {contextStr}.</>}
          body={paidPx.length > 0 && <><strong>{p1(freeN, "session")}</strong> are free. Paid sessions average <strong>{gbp(avgPaid)}</strong>.</>}
        />
      )}
    </div>
  );
}
