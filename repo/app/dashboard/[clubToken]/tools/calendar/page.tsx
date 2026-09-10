import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";

export default async function Calendar({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

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
      <h2>
        Calendar <span className="count-badge">{items.length} scheduled</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Events from across The NBRH, all in one place.
      </p>
      <CalendarView items={items} />
    </div>
  );
}
