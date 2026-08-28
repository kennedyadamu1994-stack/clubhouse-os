/**
 * Kennedy's email notification loop (architecture.md § Notifications,
 * rebuilt 27 Aug once it became clear the real action ledger lives in
 * the app's database, not a Google Sheet — the original version of this
 * script watched an "Actions_Log" tab that the live app never actually
 * writes to).
 *
 * The app now writes one row to a NOTIFICATIONS tab on the CHOS Workspace
 * spreadsheet every time a club successfully logs a pink-button action
 * (see lib/actions.ts's notifyKennedyOfAction, called from
 * submitOutreachAction). This script's only job is to watch that tab and
 * email Kennedy the moment a new row appears.
 *
 * Columns this script expects, in this exact order (the app writes them
 * in this order — see lib/actions.ts's appendRow call):
 *   A: timestamp (ISO string)
 *   B: club name
 *   C: action label (human-readable, e.g. "Reach out to a club")
 *   D: token cost
 *   E: notes (the club's own free text, may be blank)
 *
 * A "sent" column (F) is added automatically by this script the first
 * time it runs, tracking which rows have already been emailed — this
 * replaces the old "notified" boolean column, since the app's own write
 * only ever appends the five columns above and has no way to mark a row
 * read afterwards.
 *
 * Install (on the "CHOS Workspace" spreadsheet — NOT the master
 * database spreadsheet, since that's where the app writes this tab):
 *   1. Create a tab named exactly "NOTIFICATIONS" if it doesn't already
 *      exist (the app will create rows in it, but Apps Script triggers
 *      need the tab to exist first).
 *   2. Open Extensions → Apps Script, paste this file in.
 *   3. Replace NOTIFY_EMAIL below with your real email address.
 *   4. Triggers (clock icon, left sidebar) → Add Trigger:
 *        Function: notifyNewActions
 *        Event source: Time-driven
 *        Type: Minutes timer → Every 5 minutes
 *   5. Add a SECOND trigger, same function, but:
 *        Type: Day timer → whatever time you like (e.g. 6–7am)
 *      This is the safety-net resend for anything the 5-minute trigger
 *      missed (a Sheets API hiccup, a quota limit, etc.) — the same
 *      function handles both the near-real-time checks and the daily
 *      sweep, since it always re-checks every row's "sent" column.
 */
const NOTIFY_EMAIL = "PASTE_KENNEDY_EMAIL_HERE"; // your real email address

function notifyNewActions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NOTIFICATIONS");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return;

  // Column F ("sent") is managed by this script, not the app — add the
  // header once if it's missing, so a brand-new NOTIFICATIONS tab (with
  // only the app's five columns) still works the first time this runs.
  const hasSentHeader = String(data[0][5] || "").toLowerCase() === "sent";
  if (!hasSentHeader) {
    sheet.getRange(1, 6).setValue("sent");
  }

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const [timestamp, clubName, actionLabel, tokenCost, notes, sent] = row;
    if (!timestamp) continue; // skip blank rows
    if (String(sent).toUpperCase() === "TRUE") continue; // already emailed

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Club House OS: ${actionLabel} from ${clubName} (${tokenCost} token${tokenCost == 1 ? "" : "s"})`,
      body:
        `Club: ${clubName}\nAction: ${actionLabel}\nTokens: ${tokenCost}\nNotes: ${notes || "—"}\n\n` +
        `Logged at: ${timestamp}\nOpen the NOTIFICATIONS tab (row ${r + 1}) for the full record.`,
    });
    sheet.getRange(r + 1, 6).setValue(true);
  }
}
