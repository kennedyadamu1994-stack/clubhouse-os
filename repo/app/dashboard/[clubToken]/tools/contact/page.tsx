import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { ContactButton } from "@/components/contact-button";
import { FeatureRequestButton } from "@/components/feature-request-button";
import { ListCalloutButton } from "@/components/list-callout-button";

export default async function Contact({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  // Needed for List a call-out's own affordability check — it costs 1
  // real token (see tokens_reference.json / ActionPopup's options
  // below), so ListCalloutButton genuinely needs to know whether this
  // club has ever spent a token before, same as every other paid action
  // in the app. Moved here from the now-removed Workspace → Opportunities
  // page, along with the button
  // itself (Kennedy's explicit choice, 9 Sep, when that page was
  // removed: "perhaps on the 'contact us' sub section").
  const actions = await db.getActionsForClub(club.club_id);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;

  return (
    <div className="contact-boxes">
      <div className="card outreach-card">
        <h2>Contact Us</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
          Request a change, make a suggestion, report a bug, ask for help, or rate the platform.
          This is always free and never costs a token.
        </p>
        <ContactButton clubToken={clubToken} club_id={club.club_id} />
      </div>

      <div className="card outreach-card">
        <h2>Request a Feature</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
          Got an idea for something the platform should do? Tell us what you&apos;d like to see.
          This is always free and never costs a token.
        </p>
        <FeatureRequestButton clubToken={clubToken} club_id={club.club_id} />
      </div>

      <div className="card outreach-card">
        <h2>List a Call-out</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
          Looking for volunteers, coaches, or anything else from other clubs nearby? Post a
          call-out and write what you need in the notes field when you submit.
        </p>
        <ListCalloutButton clubToken={clubToken} club_id={club.club_id} isFirstTokenEncounter={isFirstToken} />
      </div>
    </div>
  );
}
