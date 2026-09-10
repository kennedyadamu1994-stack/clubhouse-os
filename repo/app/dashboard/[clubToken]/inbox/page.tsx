import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { InboxList } from "@/components/inbox-list";

/**
 * Club-facing Inbox — linked from the header's inbox icon
 * (components/app-header.tsx). Content is scoped server-side to this
 * club only (club_id filter happens inside getInboxMessages — CLAUDE.md
 * rule 1), chronological order, with persistent per-club read/unread
 * state (see InboxReadState's doc comment in lib/types.ts for why that
 * lives in Postgres, not the sheet).
 *
 * Redesigned 27 Aug third follow-up ("make the Inbox look more like an
 * email inbox... right now it looks very unprofessional") — proper H2 +
 * subtitle pairing (matching the pattern every other page in this app
 * uses), and InboxList itself rebuilt with a sender avatar, bold
 * unread/quiet read weighting, message previews, and relative dates —
 * see that component's own doc comment for the full list of changes.
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
  const unreadCount = messages.filter((m) => !m.read).length;
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <div className="inbox-page-header">
        <h2>
          Inbox <span className="count-badge">{messages.length} messages</span>
        </h2>
        <p className="inbox-page-subtitle">
          {unreadCount > 0
            ? `${unreadCount} unread, correspondence and updates from The NBRH.`
            : "Correspondence and updates from The NBRH."}
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          message="No messages yet, anything we send you will show up here."
          cta="Contact us"
          href={club.plan_tier === "free" ? "https://thenbrh.co.uk" : `${base}/tools/contact`}
        />
      ) : (
        <InboxList clubToken={clubToken} club_id={club.club_id} messages={messages} />
      )}
    </div>
  );
}
