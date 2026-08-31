import { NextResponse } from "next/server";

/**
 * TEMPORARY debug route — diagnoses why match scores show nothing (30
 * Aug). Shows exactly what the real Sheets connection reads for a club's
 * tags and a sample of real entry tags, bypassing everything else in the
 * app so we can see the raw truth rather than guess. Delete this route
 * once the issue is found — same pattern as the earlier sheets-debug
 * route used to diagnose the original Sheets connection.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const report: Record<string, unknown> = {};

  if (!token) {
    return NextResponse.json(
      { error: "Pass ?token=YOUR_CLUB_TOKEN in the URL" },
      { status: 400 },
    );
  }

  try {
    const { readTab, rowsToObjects } = await import("@/lib/data/sheets/client");
    const rawRows = await readTab("master", "DASHBOARD (X)");
    const objects = rowsToObjects(rawRows);
    const headerRow = rawRows[0] ?? [];
    report.realHeaderRow = headerRow;
    report.hasExactColumnNamedTags = headerRow.map((h) => h.trim()).includes("Tags");
    report.everyHeaderContainingTagWord = headerRow.filter((h) =>
      h.toLowerCase().includes("tag"),
    );

    const myRow = objects.find((r) => r["Club ID"] === token);
    report.foundMatchingClubRow = Boolean(myRow);
    if (myRow) {
      report.rawTagsCellValue = myRow["Tags"] ?? "MISSING_KEY";
      report.allKeysOnThisRow = Object.keys(myRow);
    }
  } catch (e) {
    report.dashboardReadError = e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
  }

  try {
    const { getAdapter } = await import("@/lib/data");
    const db = getAdapter();
    report.adapterInUse = db.constructor.name;
    const club = await db.getClubByToken(token);
    report.parsedClubTags = club?.tags ?? "CLUB_NOT_FOUND";
    report.parsedClubName = club?.name ?? null;

    if (club) {
      const { tagMatchScore } = await import("@/lib/scoring");
      const sponsorships = await db.getSponsorships();
      report.sampleSponsorshipTagsAndScores = sponsorships.slice(0, 5).map((s) => ({
        title: s.title,
        tags: s.tags,
        score: tagMatchScore(club, s.tags),
      }));
    }
  } catch (e) {
    report.scoringError = e instanceof Error ? { message: e.message, stack: e.stack } : String(e);
  }

  return NextResponse.json(report, { status: 200 });
}
