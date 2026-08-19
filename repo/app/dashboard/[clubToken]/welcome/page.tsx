import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { headerImageFor } from "@/lib/header-image";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * Personalised splash screen — the first thing a club sees when they open
 * their own link, before the dashboard shell (sidebar, banner, tabs) loads.
 * Deliberately its own route one level below the token (/welcome), not the
 * token URL itself: /dashboard/[clubToken] resolves through
 * dashboard/[clubToken]/layout.tsx, which already renders the full sidebar
 * + header shell — a splash placed there would render *inside* that shell,
 * defeating the point of a clean welcome screen. No longer linked from "/"
 * now that the pilot's public splash goes straight to the dashboard, but
 * kept here (unlinked) as a working per-club onboarding screen for whenever
 * a second club joins and this pattern is needed again.
 */
export default async function ClubWelcome({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const image = headerImageFor(club.sport, club.header_image_url);

  return (
    <main className="splash">
      <div className="splash-media" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- per-club photo, not a static asset */}
        <img src={image} alt="" />
        <div className="splash-scrim" />
      </div>

      <div className="splash-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" className="splash-mark" />

        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Club House OS · for {club.name}
        </p>
        <h1 className="splash-title">
          Welcome back,
          <br />
          {club.name}
        </h1>
        <p className="splash-sub">
          Your dashboard is set up for {club.sport.toLowerCase()} in {club.area} — outreach,
          sponsorship leads, and everything else The NBRH has found for you, ready when you are.
        </p>

        <Link href={`/dashboard/${clubToken}`} className="btn btn-pink splash-cta">
          Open your dashboard
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
