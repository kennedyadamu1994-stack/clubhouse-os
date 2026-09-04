import type { ReasonChip } from "@/lib/relevance";

/**
 * Renders an entry's reason chips (v3 relevance system, replacing
 * MatchScoreBadge — see lib/relevance.ts doc comment for the full
 * reasoning). Sized and placed to match the existing "New" badge exactly
 * (Kennedy, 1 Sep follow-up: "same size... on the same line as the New
 * badge") — reuses .entry-badge itself rather than the larger .chip
 * class the old version used, and EntryCard renders this inside the
 * title row alongside .entry-badge-new/.entry-badge-sponsored/
 * .entry-badge-verified, not in the meta row with tags.
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
