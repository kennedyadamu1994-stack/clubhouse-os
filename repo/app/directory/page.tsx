import Link from "next/link";
import { getAdapter } from "@/lib/data";
import { PLAN_TIER_LABEL } from "@/lib/types";

/**
 * Pilot-only club directory. Lists every club and links straight into its
 * welcome screen — no token to remember. This is deliberately NOT the model
 * for real clubs: once other clubs' real data is on the platform, this page
 * would let anyone browse every club's dashboard, which defeats the
 * server-side scoping in app/dashboard/[clubToken]/layout.tsx. Lives at
 * /directory (not "/", which is now the public splash page) for exactly
 * that reason — keep this for solo/internal testing only; gate or remove it
 * before onboarding real clubs (see DECISIONS.md).
 */
export default async function Directory() {
  const db = getAdapter();
  // getAdapter() has no "list all clubs" method by design (every other page
  // is scoped to one club via its token) — read the seed file directly here,
  // the one deliberate exception, only for this internal directory view.
  const clubs = await db.getAllClubsForDirectory();

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>
          Club House <em style={{ color: "var(--pink)", fontStyle: "normal" }}>OS</em>
        </h1>
        <p style={{ color: "var(--dim)", marginBottom: 32, fontSize: "0.9rem" }}>
          Internal testing directory — pick a club to open its welcome screen. Real clubs will
          only ever use their own private link, not this page.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clubs.map((c) => (
            <Link
              key={c.club_id}
              href={`/dashboard/${c.club_token}/welcome`}
              className="card"
              style={{ display: "block", textDecoration: "none" }}
            >
              <div style={{ fontFamily: "var(--font-head)", fontSize: "1.15rem" }}>{c.name}</div>
              <div style={{ color: "var(--dim)", fontSize: "0.85rem", marginTop: 4 }}>
                {c.sport} · {c.area} · {PLAN_TIER_LABEL[c.plan_tier]} plan
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

