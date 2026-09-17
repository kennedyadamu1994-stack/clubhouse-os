import { getAdapter } from "@/lib/data";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";

/**
 * POS Calendar — identical to CHOS's own (app/dashboard/[clubToken]/
 * tools/calendar/page.tsx), which is deliberate: Calendar is
 * platform-wide already, not filtered by club (Kennedy's own standing
 * decision), and getEvents() takes no arguments at all — there was
 * never anything club-specific here to strip out for POS. The only
 * difference from the CHOS version is no token/notFound() guard, since
 * this route has no token to check.
 */
export default async function PublicCalendar() {
  const db = getAdapter();
  const events = await db.getEvents();

  const items: CalendarItem[] = events.map((e) => ({
    id: e.event_id,
    title: e.title,
    date: e.date,
    endDate: e.end_date,
    area: e.area,
    type: e.type,
    link: e.link,
    description: e.notes,
    source: "event" as const,
  }));

  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Events from across The NBRH, all in one place. <span className="count-badge">{items.length} scheduled</span>
      </p>
      <CalendarView items={items} />
    </div>
  );
}
