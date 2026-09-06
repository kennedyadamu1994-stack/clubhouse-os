import Link from "next/link";
import { getAdapter } from "@/lib/data";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * General splash page — the public front door at "/". Pilot has exactly
 * one club, so the CTA looks it up server-side and links straight to its
 * dashboard — never a hardcoded token, so nothing here breaks if that
 * token is ever rotated (see README's "rotate before real use" note).
 * If a second club is ever onboarded, this deliberately falls back to the
 * internal multi-club directory rather than guessing which one to send
 * new visitors to; see that file's own comment for why it must stay
 * pilot/internal-only once more than one real club exists.
 */
export default async function Home() {
  const clubs = await getAdapter().getAllClubsForDirectory();
  const ctaHref = clubs.length === 1 ? `/dashboard/${clubs[0].club_token}` : "/directory";

  return (
    <main className="splash splash-generic">
      <div className="splash-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" className="splash-mark" />

        <p className="eyebrow" style={{ marginBottom: 14 }}>
          The Neighbourhood
        </p>
        <h1 className="splash-title">
          Club House <em>OS</em>
        </h1>
        <p className="splash-sub">
          A personalised dashboard for grassroots clubs — outreach, sponsorship, and everything
          The NBRH has found for you, all in one place.
        </p>

        <Link href={ctaHref} className="btn btn-pink splash-cta">
          Go to your dashboard
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
