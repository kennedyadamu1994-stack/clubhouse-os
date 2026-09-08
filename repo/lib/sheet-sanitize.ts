/**
 * Neutralises a single value before it's written into a Google Sheets
 * cell (5 Sep security fix) — OWASP's documented CSV/Formula Injection
 * defense: https://owasp.org/www-community/attacks/CSV_Injection.
 *
 * Every free-text field a club can type into (the "Notes for The NBRH"
 * box on an action, the Contact Us form, the Feature Request form, and
 * "Report an issue with this action") eventually lands in a real
 * Google Sheets cell via appendRow() — see notifyKennedyOfAction in
 * lib/actions.ts. Without this, a club (or anyone reaching that same
 * code path) could type a value like `=HYPERLINK("http://evil.com",
 * "Click me")` or a formula designed to read and exfiltrate OTHER
 * cells on the sheet, and it would sit there as a live, working
 * formula the moment Kennedy opens the sheet normally — no unusual
 * action on his part required, just opening a spreadsheet he already
 * trusts.
 *
 * The fix: if a value (after trimming leading whitespace, since a
 * sneaky value could hide a leading space before the dangerous
 * character) starts with any of the characters a spreadsheet treats as
 * "this cell is a formula" — =, +, -, @, a tab, or a carriage return,
 * plus their full-width Unicode lookalikes (＝ ＋ － ＠), which OWASP
 * notes can trigger the same behaviour in some locale settings — a
 * single quote is prepended. A leading apostrophe is the standard,
 * universal way to tell every major spreadsheet program "treat this
 * cell as plain text, never evaluate it," without changing how the
 * text actually displays to a human reading the sheet.
 *
 * Deliberately narrow in scope: this ONLY defuses formula execution.
 * It doesn't reject, truncate, or otherwise alter genuinely plain text
 * (a note that starts with a normal letter or number is returned
 * completely unchanged) — the goal is neutralising a specific, real
 * attack, not being a general-purpose input filter.
 */
const DANGEROUS_LEADING_CHARS = ["=", "+", "-", "@", "\t", "\r", "＝", "＋", "－", "＠"];

export function sanitizeForSheet(value: string | undefined | null): string {
  if (!value) return "";
  const trimmedStart = value.replace(/^\s+/, "");
  const startsDangerously = DANGEROUS_LEADING_CHARS.some((c) => trimmedStart.startsWith(c));
  return startsDangerously ? `'${value}` : value;
}
