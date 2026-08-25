/**
 * Match-score colour scale (Kennedy's spec): 0% = deep red, 50% = yellow,
 * 100% = dark green, with a genuine gradient in between — not three fixed
 * colours with everything else defaulting to the nearest one.
 *
 * Implementation: HSL hue interpolation. Hue 0° is red, 60° is yellow,
 * 120° is green — exactly the three anchor points the spec describes, and
 * every score between them gets its own point on that same hue line, so
 * a 63% match is visibly different from a 58% one.
 */
export function matchScoreColour(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  const hue = (s / 100) * 120; // 0 (red) -> 60 (yellow) -> 120 (green)
  const saturation = 78;
  // Lightness peaks at the yellow midpoint and dips at both red and green
  // ends. Yellow at low lightness reads as olive/mustard, not "yellow" — a
  // flat or monotonic lightness curve makes 50% look muddy. A curve shaped
  // like an upside-down V (low → high → low) keeps 0% a genuine deep red,
  // 50% a genuine bright yellow, and 100% a genuine dark green.
  const distanceFromMid = Math.abs(s - 50) / 50; // 0 at the midpoint, 1 at either end
  const lightness = 46 - distanceFromMid * 16; // 46% at 50%, 30% at 0%/100%
  return `hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness.toFixed(0)}%)`;
}

/** Readable text colour for a chip using matchScoreColour as its background — white holds contrast across the whole scale at this lightness range. */
export const matchScoreTextColour = "#ffffff";
