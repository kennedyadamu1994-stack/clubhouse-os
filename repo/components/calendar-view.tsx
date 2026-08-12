"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface CalendarItem {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  endDate: string | null;
  area: string;
  type: string;
  link: string;
  description: string;
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
 *
 * Every cell is a FIXED height (.cal-cell in globals.css), not min-height —
 * a min-height grid lets busy weeks grow taller than quiet ones, which is
 * what made the calendar look uneven. Fixed height + internal scroll/cap
 * keeps every cell — and therefore every row — identical regardless of
 * how many items land on a given day.
 *
 * Clicking any item (grid chip or agenda row) opens a detail popup with
 * the full description and an external link, rather than linking out
 * directly — see EventDetailModal below.
 *
 * Sheets-readiness: this component and CalendarItem don't change when
 * Events/Opportunities move from local JSON to a live Google Sheet — the
 * seam is lib/data's adapter (see lib/data/sheets.ts's own note), which
 * already returns the same shape either way. "Live updating" from a Sheet
 * is a question of how the PAGE fetches (revalidation interval, or a
 * client poll), not something this component needs to know about.
 */
export function CalendarView({ items, base }: { items: CalendarItem[]; base: string }) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [openItem, setOpenItem] = useState<CalendarItem | null>(null);

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

  // Fixed cell height comfortably fits a day number + 2 chips; anything
  // beyond that collapses into a "+N more" chip that opens the same popup
  // for the first hidden item, rather than growing the cell.
  const MAX_CHIPS_PER_CELL = 2;

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
          {/* Desktop month grid — every cell is a fixed height (globals.css), so
              rows stay even regardless of how many items land on a given day. */}
          <div className="cal-grid" role="grid" aria-label={monthLabel}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="cal-weekday">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const dayItems = day !== null ? itemsByDay.get(day) ?? [] : [];
              return (
                <div key={i} className={`cal-cell ${day === null ? "cal-cell-empty" : ""} ${day && isToday(day) ? "cal-cell-today" : ""}`}>
                  {day !== null && (
                    <>
                      <span className="cal-daynum">{day}</span>
                      <div className="cal-events">
                        {dayItems.slice(0, MAX_CHIPS_PER_CELL).map((it) => (
                          <span
                            key={it.id}
                            className={`cal-chip cal-chip-${it.source}`}
                            title={it.title}
                            role="button"
                            tabIndex={0}
                            onClick={() => setOpenItem(it)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenItem(it)}
                          >
                            {it.title}
                          </span>
                        ))}
                        {dayItems.length > MAX_CHIPS_PER_CELL && (
                          <span
                            className="cal-chip-more"
                            role="button"
                            tabIndex={0}
                            onClick={() => setOpenItem(dayItems[MAX_CHIPS_PER_CELL])}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") && setOpenItem(dayItems[MAX_CHIPS_PER_CELL])
                            }
                          >
                            +{dayItems.length - MAX_CHIPS_PER_CELL} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile agenda list — always the mobile presentation, never the grid above */}
          <div className="cal-agenda">
            {itemsInMonth.map((it) => (
              <button key={it.id} className="cal-agenda-row" onClick={() => setOpenItem(it)}>
                <div className="cal-agenda-date">
                  {new Date(it.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
                <div className="cal-agenda-main">
                  <div className="cal-agenda-title">{it.title}</div>
                  <div className="cal-agenda-sub">
                    {it.area} · {it.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {openItem && <EventDetailModal item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function EventDetailModal({ item, onClose }: { item: CalendarItem; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dateLabel = new Date(item.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDateLabel = item.endDate
    ? new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef} tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <span className="cal-detail-source">{item.source === "event" ? "Event" : "Opportunity"}</span>
        <h2 id={titleId}>{item.title}</h2>

        <div style={{ marginTop: 14 }}>
          <div className="cal-detail-row">
            <strong>When:</strong> {dateLabel}
            {endDateLabel && <> – {endDateLabel}</>}
          </div>
          <div className="cal-detail-row">
            <strong>Area:</strong> {item.area}
          </div>
          <div className="cal-detail-row">
            <strong>Type:</strong> {item.type}
          </div>
        </div>

        {item.description && <p className="cal-detail-desc">{item.description}</p>}

        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn btn-black">
            Open link
          </a>
        )}
      </div>
    </div>
  );
}
