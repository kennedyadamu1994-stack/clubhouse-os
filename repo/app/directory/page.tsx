import Link from "next/link";
import { getAdapter } from "@/lib/data";
import { PLAN_TIER_LABEL } from "@/lib/types";
import { PaginatedList } from "@/components/paginated-list";
import { requireAdminOrRedirect } from "@/lib/auth/guard";

/**
 * Internal club directory — pick a club to open its welcome screen
 * without needing to know its real token/link. Was genuinely
 * unprotected until 5 Sep (this doc comment used to say "keep this for
 * solo/internal testing only; gate or remove it before onboarding real
 * clubs" — real clubs are now live, so that gate is this: the same
 * requireAdminOrRedirect() guard already proven working on
 * /admin/requests. Kennedy confirmed he still wants this page for quick
 * access, just genuinely locked behind the real admin login rather than
 * "not linked from anywhere", which was never real protection.
 */
export default async function Directory() {
  await requireAdminOrRedirect();
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

        <PaginatedList
          className=""
          items={clubs.map((c) => (
            <Link
              key={c.club_id}
              href={`/dashboard/${c.club_token}/welcome`}
              className="card"
              style={{ display: "block", textDecoration: "none", marginBottom: 12 }}
            >
              <div style={{ fontFamily: "var(--font-head)", fontSize: "1.15rem" }}>{c.name}</div>
              <div style={{ color: "var(--dim)", fontSize: "0.85rem", marginTop: 4 }}>
                {c.sport} · {c.area} · {PLAN_TIER_LABEL[c.plan_tier]} plan
              </div>
            </Link>
          ))}
        />
      </div>
    </main>
  );
}

