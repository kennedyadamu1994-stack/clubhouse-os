import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";

/** Personal (token'd) POS Guide — content identical to the public version, re-guarded per-page the same way the Calendar/Jobs pairs are. */
export default async function PlayerGuide({
  params,
}: {
  params: Promise<{ playerToken: string }>;
}) {
  const { playerToken } = await params;
  const db = getAdapter();
  const player = await db.getPlayerByToken(playerToken);
  if (!player) notFound();

  return (
    <div className="card outreach-card">
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginBottom: 20, maxWidth: "58ch" }}>
        Everything you need to know about getting started with The NBRH.
      </p>
      <EmptyState message="The Guide is coming soon." cta="Back to Home" href={`/players/${playerToken}`} />
    </div>
  );
}
