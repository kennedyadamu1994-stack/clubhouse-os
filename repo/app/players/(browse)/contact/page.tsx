import { PlayerContactForm } from "@/components/player-contact-form";

/**
 * Contact Us / Request a Feature — ported from CHOS's own Contact page
 * (app/dashboard/[clubToken]/tools/contact/page.tsx), 15 Sep, Kennedy:
 * "The Contact page in the CHOS, can you add this as an option in the
 * dropdown of the POS. With the contact us & request a feature." Only
 * these two sections — List a Call-out (CHOS's real third section) is
 * a genuinely club-specific concept (clubs posting call-outs to other
 * clubs), not something Kennedy named, and not ported here.
 */
export default function PublicContact() {
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
