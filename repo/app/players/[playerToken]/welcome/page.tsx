import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { headerImageFor } from "@/lib/header-image";
import { NBRH_LOGO_URL } from "@/lib/brand";

/**
 * Personalised splash screen — the first thing a player sees right
 * after onboarding. Mirrors app/dashboard/[clubToken]/welcome/page.tsx's
 * own structure and reasoning, including the same real behaviour that
 * page's own doc comment describes but doesn't fully hold given how
 * Next.js layouts actually nest (verified 15 Sep): this page's route
 * DOES still render inside app/players/[playerToken]/layout.tsx's full
 * shell (sidebar, header, tab bar) — a layout wraps every page below
 * it in the tree, including a page one level down, not just the exact
 * token URL. That's consistent with CHOS's own real, already-shipped
 * structure (its welcome page sits under app/dashboard/[clubToken]/
 * layout.tsx the same way), so this is left as-is rather than pulled
 * into its own route group — Kennedy's instruction is for POS to match
 * CHOS's real behaviour, not an assumption about it.
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
