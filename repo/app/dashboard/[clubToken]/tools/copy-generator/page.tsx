import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";

/**
 * Copy Generator is deliberately NOT built here. DECISIONS.md D5 (Copy
 * Generator delivery model — standalone tool vs. requestable service) is
 * still OPEN, and docs/sections 03-05 § Copy Generator is explicit: "Do not
 * scaffold until decided... the one permitted deferral, because it's an
 * explicit open decision, not scope-cutting." This tile stands in until
 * Kennedy answers D5 — see DECISIONS.md.
 */
export default async function CopyGenerator({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  return (
    <div className="card outreach-card">
      <h2>Copy Generator</h2>
      <div className="empty">
        <p>
          Short-form copy, SEO copy, and blog titles/hooks — coming soon. We&apos;re still
          deciding whether this runs as a self-serve tool or a requestable service, so it&apos;s
          not switched on yet. In the meantime, get in touch and Kennedy can help directly.
        </p>
        <a className="btn btn-pink" href={`/dashboard/${clubToken}`}>
          Back to your dashboard
        </a>
      </div>
    </div>
  );
}
