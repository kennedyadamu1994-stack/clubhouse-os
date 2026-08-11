/**
 * Kennedy's notification loop (architecture.md § Notifications).
 * Fires on every new Actions_Log row where notified = FALSE, sends the D2 channel
 * (email below by default — swap sendEmail for a Slack webhook fetch once D2 is decided),
 * then marks the row notified. A daily sweep re-sends anything missed.
 *
 * Install alongside backup.gs, then add TWO triggers:
 *   notifyNewActions → time-driven → minutes timer → every 5 minutes
 *   notifyNewActions → time-driven → day timer (the sweep is the same function)
 *
 * Assumes Actions_Log columns per docs/schema.md, with header row 1.
 */
const NOTIFY_EMAIL = "PASTE_KENNEDY_EMAIL_HERE"; // decision D2

function notifyNewActions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Actions_Log");
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const header = data[0].map(String);
  const col = (name) => header.indexOf(name);
  const [iNotified, iClub, iAction, iCost, iNotes, iStatus] = [
    col("notified"), col("club_id"), col("action_key"), col("token_cost"), col("notes"), col("status"),
  ];
  if (iNotified < 0) return;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (String(row[iNotified]).toUpperCase() === "TRUE") continue;
    if (String(row[iStatus]) === "cancelled") continue;

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Club House OS: ${row[iAction]} from ${row[iClub]} (${row[iCost]} token${row[iCost] == 1 ? "" : "s"})`,
      body:
        `Club: ${row[iClub]}\nAction: ${row[iAction]}\nTokens: ${row[iCost]}\nNotes: ${row[iNotes] || "—"}\n\n` +
        `Open the Actions_Log (row ${r + 1}) to action it, then set status to complete.`,
    });
    sheet.getRange(r + 1, iNotified + 1).setValue(true);
  }
}
