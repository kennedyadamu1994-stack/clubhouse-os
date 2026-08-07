"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface CalendarItem {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  endDate: string | null;
  area: string;
  type: string;
  link: string;
  source: "event" | "opportunity";
}

/**
 * Calendar (docs/sections 03-05 § Tools: "read-only month view from Events
 * + dated Opportunities rows (D6). Mobile: agenda list, not a squeezed
 * grid."). One component, two presentations of the same data, gated by CSS
 * (.cal-grid / .cal-agenda) rather than two separate components — same
 * pattern as EntryCard's row layout switching at the mobile breakpoint.
 * The month grid is desktop-only; mobile always gets the agenda list, per
 * the spec's explicit warning against squeezing a grid onto a phone.
 */
export function CalendarView({ items, base }: { items: CalendarItem[]; base: string }) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const itemsInMonth = useMemo(() => {
    return items
      .filter((it) => {
        const d = new Date(it.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, year, month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalendarItem[]>();
    itemsInMonth.forEach((it) => {
      const day = new Date(it.date).getDate();
      const list = map.get(day) ?? [];
      list.push(it);
      map.set(day, list);
    });
    return map;
  }, [itemsInMonth]);

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function shiftMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <button className="btn btn-black" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ← Prev
        </button>
        <h3 style={{ fontSize: "1rem" }}>{monthLabel}</h3>
        <button className="btn btn-black" onClick={() => shiftMonth(1)} aria-label="Next month">
          Next →
        </button>
      </div>

      {itemsInMonth.length === 0 ? (
        <div className="empty">
          <p>Nothing scheduled this month.</p>
          <Link className="btn btn-pink" href={`${base}/workspace/opportunities`}>
            See Opportunities
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop month grid */}
          <div className="cal-grid" role="grid" aria-label={monthLabel}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="cal-weekday">
                {d}
              </div>
            ))}
            {cells.map((day, i) => (
              <div key={i} className={`cal-cell ${day === null ? "cal-cell-empty" : ""} ${day && isToday(day) ? "cal-cell-today" : ""}`}>
                {day !== null && (
                  <>
                    <span className="cal-daynum">{day}</span>
                    <div className="cal-events">
                      {(itemsByDay.get(day) ?? []).slice(0, 3).map((it) => (
                        <span key={it.id} className={`cal-chip cal-chip-${it.source}`} title={it.title}>
                          {it.title}
                        </span>
                      ))}
                      {(itemsByDay.get(day)?.length ?? 0) > 3 && (
                        <span className="cal-chip-more">+{(itemsByDay.get(day)?.length ?? 0) - 3} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Mobile agenda list — always the mobile presentation, never the grid above */}
          <div className="cal-agenda">
            {itemsInMonth.map((it) => (
              <div key={it.id} className="cal-agenda-row">
                <div className="cal-agenda-date">
                  {new Date(it.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
                <div className="cal-agenda-main">
                  <div className="cal-agenda-title">{it.title}</div>
                  <div className="cal-agenda-sub">
                    {it.area} · {it.type}
                  </div>
                </div>
                {it.link && (
                  <a href={it.link} target="_blank" rel="noopener noreferrer" className="btn btn-black cal-agenda-link">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
