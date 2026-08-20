import { NextResponse } from "next/server";

/**
 * TEMPORARY debug route — diagnoses the Sheets connection directly,
 * bypassing getAdapter()'s error-swallowing (readTab serves stale/empty
 * data on failure rather than crashing, per architecture.md § Failure —
 * good for resilience, bad for debugging, since a real failure and "no
 * data yet" currently look identical from the outside). Delete this route
 * once the /directory issue is diagnosed.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const report: Record<string, unknown> = {};

  report.env = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    GOOGLE_PRIVATE_KEY: Boolean(process.env.GOOGLE_PRIVATE_KEY),
    GOOGLE_SHEET_ID_MASTER: process.env.GOOGLE_SHEET_ID_MASTER ?? null,
    GOOGLE_SHEET_ID_WORKSPACE: process.env.GOOGLE_SHEET_ID_WORKSPACE ?? null,
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
  };

  try {
    const { getAdapter } = await import("@/lib/data");
    const db = getAdapter();
    report.adapterInUse = db.constructor.name;
  } catch (e) {
    report.adapterConstructionError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { readTab } = await import("@/lib/data/sheets/client");
    const rawRows = await readTab("master", "DASHBOARD (X)");
    report.rawRowCount = rawRows.length;
    report.rawHeaderRow = rawRows[0] ?? null;
    report.rawFirstDataRow = rawRows[1] ?? null;
  } catch (e) {
    report.readTabError = e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
  }

  try {
    const { getAdapter } = await import("@/lib/data");
    const db = getAdapter();
    const clubs = await db.getAllClubsForDirectory();
    report.parsedClubCount = clubs.length;
    report.parsedClubs = clubs;
  } catch (e) {
    report.getAllClubsError = e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
  }

  return NextResponse.json(report, { status: 200 });
}
