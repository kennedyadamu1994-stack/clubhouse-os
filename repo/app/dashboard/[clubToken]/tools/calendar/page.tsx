import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";

const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  workshop: "Workshop",
  event: "Event",
  pr: "PR opportunity",
  resource: "Resource",
  callout: "Call-out",
};

export default async function Calendar({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [events, opportunities] = await Promise.all([db.getEvents(), db.getOpportunities()]);

  const items: CalendarItem[] = [
    ...events.map((e) => ({
      id: e.event_id,
      title: e.title,
      date: e.date,
      endDate: e.end_date,
      area: e.area,
      type: e.type,
      link: e.link,
      description: e.notes,
      source: "event" as const,
    })),
    ...opportunities
      .filter((o) => o.status === "open" && o.type !== "callout") // callouts aren't dated events to attend
      .map((o) => ({
        id: o.opportunity_id,
        title: o.title,
        date: o.date,
        endDate: null,
        area: o.area,
        type: OPPORTUNITY_TYPE_LABEL[o.type] ?? o.type,
        link: o.link,
        description: o.description,
        source: "opportunity" as const,
      })),
  ];

  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <h2>
        Calendar <span className="count-badge">{items.length} scheduled</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        Events and dated opportunities from across The NBRH, all in one place.
      </p>
      <CalendarView items={items} base={base} />
    </div>
  );
}
