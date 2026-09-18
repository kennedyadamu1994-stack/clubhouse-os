import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";

/**
 * Personal (token'd) POS Calendar — content identical to the public
 * version (app/players/calendar/page.tsx), re-guarded per-page the same
 * way CHOS's own calendar page re-checks its token rather than relying
 * solely on the layout above it (Server Components can render layout
 * and page in parallel, so the layout's own notFound() isn't a
 * guarantee this page never runs with an invalid token).
 */
export default async function PlayerCalendar({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

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
