import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { ContactButton } from "@/components/contact-button";
import { FeatureRequestButton } from "@/components/feature-request-button";

export default async function Contact({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

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
          Got an idea for something the platform should do? Tell us what you&apos;d like to see —
          this is always free and never costs a token.
        </p>
        <FeatureRequestButton clubToken={clubToken} club_id={club.club_id} />
      </div>
    </div>
  );
}
