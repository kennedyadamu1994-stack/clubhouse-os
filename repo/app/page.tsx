import Link from "next/link";

/**
 * General splash page — the public front door at "/". Not club-specific
 * (there's no token here to look anyone up by), so the CTA goes to the
 * internal club directory rather than any one dashboard. The old root page
 * — an internal "pick a club" testing directory — now lives at /directory;
 * see that file's own comment for why it should never be the public entry
 * point once real clubs are onboarded.
 */
export default function Home() {
  return (
    <main className="splash splash-generic">
      <div className="splash-content">
        <span className="splash-mark">N</span>

        <p className="eyebrow" style={{ marginBottom: 14 }}>
          The NBRH
        </p>
        <h1 className="splash-title">
          Club House <em>OS</em>
        </h1>
        <p className="splash-sub">
          A personalised dashboard for grassroots clubs — outreach, sponsorship, and everything
          The NBRH has found for you, all in one place.
        </p>

        <Link href="/directory" className="btn btn-pink splash-cta">
          Go to your dashboard
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
