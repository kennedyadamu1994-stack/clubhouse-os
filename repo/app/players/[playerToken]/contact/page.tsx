import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { PlayerContactForm } from "@/components/player-contact-form";

/** Personal (token'd) POS Contact — content identical to the public version, re-guarded per-page the same way the Calendar/Jobs pairs are. */
export default async function PlayerContact({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  return (
    <div className="contact-boxes">
      <div className="card outreach-card">
        <h2>Contact Us</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
          Request a change, make a suggestion, report a bug, or ask for help. This is always free.
        </p>
        <PlayerContactForm actionKey="player_contact_us" submitLabel="Send" />
      </div>

      <div className="card outreach-card">
        <h2>Request a Feature</h2>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "56ch" }}>
          Got an idea for something the platform should do? Tell us what you&apos;d like to see.
        </p>
        <PlayerContactForm actionKey="player_feature_request" submitLabel="Send" />
      </div>
    </div>
  );
}
