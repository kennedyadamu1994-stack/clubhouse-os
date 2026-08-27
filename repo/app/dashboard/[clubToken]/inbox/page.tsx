import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { InboxList } from "@/components/inbox-list";

/**
 * New club-facing Inbox (Kennedy's request, 27 Aug) — linked from the
 * header's inbox icon (components/app-header.tsx). Content is scoped
 * server-side to this club only (club_id filter happens inside
 * getInboxMessages — CLAUDE.md rule 1), chronological order, with
 * persistent per-club read/unread state (see InboxReadState's doc
 * comment in lib/types.ts for why that lives in Postgres, not the sheet).
 */
export default async function Inbox({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const messages = await db.getInboxMessages(club.club_id);
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <h2>
        Inbox <span className="count-badge">{messages.length} messages</span>
      </h2>

      {messages.length === 0 ? (
        <EmptyState
          message="No messages yet — anything we send you will show up here."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <InboxList clubToken={clubToken} club_id={club.club_id} messages={messages} />
      )}
    </div>
  );
}
