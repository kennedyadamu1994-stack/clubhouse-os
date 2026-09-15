/**
 * Daily backup snapshot (architecture.md § Resilience).
 * Install: open the master spreadsheet → Extensions → Apps Script → paste this file.
 * Then: Triggers (clock icon) → Add Trigger → dailyBackup → time-driven → day timer → 2–3am.
 * Set BACKUP_FOLDER_ID to a Drive folder ID where snapshots should land.
 */
const BACKUP_FOLDER_ID = "PASTE_DRIVE_FOLDER_ID_HERE";
const KEEP_DAYS = 30;

function dailyBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
  const stamp = Utilities.formatDate(new Date(), "Europe/London", "yyyy-MM-dd");
  DriveApp.getFileById(ss.getId()).makeCopy(`NBRH-master-backup-${stamp}`, folder);

  // Prune snapshots older than KEEP_DAYS
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000);
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf("NBRH-master-backup-") === 0 && f.getDateCreated() < cutoff) {
      f.setTrashed(true);
    }
  }
}
