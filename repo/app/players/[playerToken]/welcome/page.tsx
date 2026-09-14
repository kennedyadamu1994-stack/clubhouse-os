import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { headerImageFor } from "@/lib/header-image";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * Personalised splash screen — the first thing a player sees right
 * after onboarding, before the POS shell (sidebar, header, tabs) loads.
 * Mirrors app/dashboard/[clubToken]/welcome/page.tsx's own structure
 * and reasoning exactly: its own route one level below the token, not
 * the token URL itself, so it renders outside the full app/players/
 * [playerToken]/layout.tsx shell rather than inside it.
 *
 * This IS actively linked to — unlike the club version (currently
 * unlinked, kept only for a future second club), this is the real
 * redirect target the onboarding Server Action hands back
 * (submitOnboarding, lib/players/actions.ts → /players/[playerToken]/
 * welcome), so every new player actually lands here first.
 *
 * headerImageFor (lib/header-image.ts) takes a single sport, built for
 * a club's one sport — a player can have several (Player.sports is an
 * array), so this passes their first favourite, falling back to the
 * function's own generic default when they have none for any reason.
 */
export default async function PlayerWelcome({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  const image = headerImageFor(player.sports[0] ?? "", null);

  return (
    <main className="splash">
      <div className="splash-media" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- external stock photo, not a static asset */}
        <img src={image} alt="" />
        <div className="splash-scrim" />
      </div>

      <div className="splash-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- external brand asset, not a static import */}
        <img src={NBRH_LOGO_URL} alt="The NBRH" className="splash-mark" />

        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Player OS
        </p>
        <h1 className="splash-title">
          Welcome,
          <br />
          {player.name ?? "there"}
        </h1>
        <p className="splash-sub">
          {player.area
            ? `Sessions, clubs, and opportunities matched to ${player.area}, ready when you are.`
            : "Sessions, clubs, and opportunities matched to you, ready when you are."}
        </p>

        <Link href={`/players/${playerToken}`} className="btn btn-pink splash-cta">
          Get started
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
