/**
 * Kennedy's email notification loop (architecture.md § Notifications,
 * rebuilt 27 Aug once it became clear the real action ledger lives in
 * the app's database, not a Google Sheet — the original version of this
 * script watched an "Actions_Log" tab that the live app never actually
 * writes to).
 *
 * The app writes one row to a NOTIFICATIONS tab on the CHOS Workspace
 * spreadsheet every time a club successfully logs a pink-button action
 * (see lib/actions.ts's notifyKennedyOfAction, called from
 * submitOutreachAction). This script's only job is to watch that tab and
 * email Kennedy the moment a new row appears.
 *
 * Columns the app writes, in this order: timestamp, club name, action
 * label, token cost, notes. A "sent" column is added by this script
 * (name-matched, not position-matched — see the 28 Aug fix note below)
 * to track which rows have already been emailed.
 *
 * FIX (28 Aug): the previous version of this script located columns by
 * fixed position (A–F), which broke the first time it ran — placing the
 * "sent" header alone in a cell before any real data existed caused the
 * Sheets API's auto-append (on the APP's side, in appendRow) to detect
 * that lone cell as the table's start column and shift every future
 * appended row to align with it, so real data landed in F–J instead of
 * A–E. That's fixed on the app side now (appendRow anchors explicitly to
 * A1:E1), but this script is ALSO rewritten to find each column by its
 * header name rather than assuming a fixed position, so a similar
 * surprise can never cause a silent misfire again.
 *
 * Install (on the "CHOS Workspace" spreadsheet — NOT the master
 * database spreadsheet, since that's where the app writes this tab):
 *   1. Make sure a tab named exactly "NOTIFICATIONS" exists.
 *   2. IF YOU RAN THE OLD VERSION OF THIS SCRIPT: it will have left a
 *      stray "sent" header and shifted data in columns F onward. Easiest
 *      fix — select and delete every existing row/column content in
 *      NOTIFICATIONS entirely (Edit → Select all, then Delete), so the
 *      tab is completely empty, then let the app and this script rebuild
 *      it cleanly from here. You won't lose anything important — the
 *      real record of what a club did lives in the app's own ledger,
 *      this tab only ever existed to trigger your email.
 *   3. Open Extensions → Apps Script, paste this file in (replacing the
 *      old version).
 *   4. Replace NOTIFY_EMAIL below with your real email address.
 *   5. Triggers (clock icon, left sidebar) → confirm the existing
 *      notifyNewActions trigger is still there (time-driven, every 5
 *      minutes) — no need to recreate it, the function name hasn't
 *      changed. Keep the daily safety-net trigger too, if you added one.
 */
const NOTIFY_EMAIL = "thenbrh@gmail.com"; // your real email address

const EXPECTED_HEADERS = ["timestamp", "club name", "action label", "token cost", "notes"];
const SENT_HEADER = "sent";

function notifyNewActions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NOTIFICATIONS");
  if (!sheet) return;

  // Ensure the header row exists and is correct, name-matched rather than
  // position-assumed — this is the actual fix for the 28 Aug bug.
  let headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 6)).getValues()[0]
    .map((h) => String(h).trim().toLowerCase());
  const isBlankHeaderRow = headerRow.every((h) => h === "");

  if (isBlankHeaderRow) {
    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length + 1).setValues([[...EXPECTED_HEADERS, SENT_HEADER]]);
    headerRow = [...EXPECTED_HEADERS, SENT_HEADER];
  }

  const col = (name) => headerRow.indexOf(name) + 1; // 1-indexed for Range calls, 0 if not found
  const cTimestamp = col("timestamp");
  const cClub = col("club name");
  const cLabel = col("action label");
  const cCost = col("token cost");
  const cNotes = col("notes");
  let cSent = col(SENT_HEADER);

  if (!cTimestamp || !cClub || !cLabel || !cCost) {
    // Headers exist but don't match what's expected — likely the sheet
    // is still in the broken pre-fix state. Stop rather than guess.
    console.error("NOTIFICATIONS header row doesn't match expected columns — see install step 2 in this file's comments.");
    return;
  }
  if (!cSent) {
    cSent = headerRow.length + 1;
    sheet.getRange(1, cSent).setValue(SENT_HEADER);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // header only, no data yet

  const data = sheet.getRange(2, 1, lastRow - 1, cSent).getValues();

  data.forEach((row, i) => {
    const timestamp = row[cTimestamp - 1];
    const clubName = row[cClub - 1];
    const actionLabel = row[cLabel - 1];
    const tokenCost = row[cCost - 1];
    const notes = cNotes ? row[cNotes - 1] : "";
    const sent = row[cSent - 1];

    if (!timestamp) return;
    if (String(sent).toUpperCase() === "TRUE") return;

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Club House OS: ${actionLabel} from ${clubName} (${tokenCost} token${tokenCost == 1 ? "" : "s"})`,
      body:
        `Club: ${clubName}\nAction: ${actionLabel}\nTokens: ${tokenCost}\nNotes: ${notes || "—"}\n\n` +
        `Logged at: ${timestamp}\nOpen the NOTIFICATIONS tab (row ${i + 2}) for the full record.`,
    });
    sheet.getRange(i + 2, cSent).setValue(true);
  });
}
