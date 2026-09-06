import type { ReasonChip } from "@/lib/relevance";

/**
 * Renders an entry's reason chips (v3 relevance system, replacing
 * MatchScoreBadge — see lib/relevance.ts doc comment for the full
 * reasoning). Sized to match .entry-badge (Kennedy, 1 Sep follow-up:
 * "same size... on the same line as the New badge").
 *
 * Moved into the expanded info panel, alongside the New/Sponsored/
 * Verified badges, inside EntryCard's own entry-detail-chips wrapper
 * (Kennedy, 6 Sep: "put any and every badge in the data cards in the
 * info expanded bit") — this component renders its chips directly, as
 * a fragment, rather than wrapping itself in another flex container,
 * since EntryCard already owns the single shared wrapper every badge
 * (including these) sits inside.
 *
 * Renders nothing when there are no chips — an entry with no matches is
 * just visibly plainer, never a broken-looking "0%" (the whole point of
 * moving away from a blended score).
 */
export function ReasonChips({ chips }: { chips: ReasonChip[] }) {
  if (chips.length === 0) return null;
  return (
    <>
      {chips.map((c) => (
        <span key={c.bucket} className="entry-badge entry-badge-reason">
          {c.label}
        </span>
      ))}
    </>
  );
}
