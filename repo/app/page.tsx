import Link from "next/link";
import { getAdapter } from "@/lib/data";
import { NBRH_LOGO_URL } from "@/lib/brand";
import { headerImageFor } from "@/lib/header-image";

/**
 * General splash page — the public front door at "/" (15 Sep restructure,
 * Kennedy: "when I open the link, the first thing I should see is the
 * choice between the club house OS and the player OS"). Previously this
 * page skipped that choice entirely and went straight to CHOS — it
 * predates POS, and a separate /choose page was built alongside it
 * without ever actually being wired in as the real entry point, so the
 * literal root link still bypassed the choice Kennedy asked for. This
 * replaces /choose's content here instead of leaving two overlapping
 * "pick CHOS or POS" pages; /choose no longer exists as a separate
 * route (both toggles — AppHeader for CHOS, PlayerHeader for POS — now
 * point at "/" instead).
 *
 * REDESIGNED (15 Sep, Kennedy: "make the splash page for the POS or
 * CHOS choice more visually appealing and stunning") — this was a
 * plain text page on a blank background; now uses the real full-bleed
 * photo + scrim treatment (.splash/.splash-media/.splash-scrim/
 * .splash-content etc.) the welcome pages already use for their own
 * hero moments, not a new visual system invented for this one page.
 * headerImageFor(headerImages[0]?...) reuses the same real, genuinely
 * platform-wide image pool (getHeaderImages(), no club/player scoping)
 * the POS header carousel already pulls from.
 *
 * The CHOS card reuses this page's own original one-club lookup logic
 * (pilot has exactly one club, so it looks it up server-side and links
 * straight to its dashboard — never a hardcoded token, so nothing here
 * breaks if that token is ever rotated; see README's "rotate before
 * real use" note) rather than the earlier /choose page's plain link to
 * /directory, which is requireAdminOrRedirect-gated and would have
 * bounced a non-admin visitor to an admin login screen instead of a
 * real club dashboard. If a second club is ever onboarded, this falls
 * back to the internal multi-club directory the same way the original
 * root page always did.
 */
export default async function Home() {
  const db = getAdapter();
  const [clubs, headerImages] = await Promise.all([db.getAllClubsForDirectory(), db.getHeaderImages()]);
  const chosHref = clubs.length === 1 ? `/dashboard/${clubs[0].club_token}` : "/directory";
  const backgroundImage = headerImages[0]?.image_url ?? headerImageFor("", null);

  return (
    <main className="splash">
      <div className="splash-media" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- external stock photo, not a static asset */}
        <img src={backgroundImage} alt="" />
        <div className="splash-scrim" />
      </div>

      <div className="splash-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" className="splash-mark" />

        <p className="eyebrow" style={{ marginBottom: 14 }}>
          The Neighbourhood
        </p>
        <h1 className="splash-title">
          Which side of <em>The NBRH?</em>
        </h1>
        <p className="splash-sub">
          Club House OS is for clubs. Player OS is for individual players.
        </p>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href={chosHref}
            className="card"
            style={{ width: 240, textDecoration: "none", padding: 24, display: "block", background: "rgba(255,255,255,0.96)" }}
          >
            <h2 style={{ fontSize: "1.05rem", marginBottom: 6, color: "var(--text)" }}>Club House OS</h2>
            <p style={{ color: "var(--dim)", fontSize: "0.82rem", margin: 0 }}>
              Run your club — outreach, sponsorship, and tools.
            </p>
          </Link>

          <Link
            href="/players"
            className="card"
            style={{ width: 240, textDecoration: "none", padding: 24, display: "block", background: "rgba(255,255,255,0.96)" }}
          >
            <h2 style={{ fontSize: "1.05rem", marginBottom: 6, color: "var(--text)" }}>Player OS</h2>
            <p style={{ color: "var(--dim)", fontSize: "0.82rem", margin: 0 }}>
              Find sessions, clubs, and opportunities near you.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
