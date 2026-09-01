import type { ReasonChip } from "@/lib/relevance";

/**
 * Renders an entry's reason chips (v3 relevance system, replacing
 * MatchScoreBadge — see lib/relevance.ts doc comment for the full
 * reasoning). Reuses the existing .chip class already used for tag rows
 * elsewhere in EntryCard, so this doesn't introduce a second visual
 * language for "chip" in the app — a modifier class marks the reliable
 * signals (sport/area/deadline) as visually distinct from a plain matched
 * tag, since sport/area/deadline are curated fields and a raw tag match is
 * a slightly weaker signal (handoff brief, open question 3).
 *
 * Renders nothing when there are no chips — an entry with no matches is
 * just visibly plainer, never a broken-looking "0%" (the whole point of
 * moving away from a blended score).
 */
export function ReasonChips({ chips }: { chips: ReasonChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="reason-chips">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`chip reason-chip ${c.kind === "reliable" ? "reason-chip-reliable" : "reason-chip-tag"}`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
