import { redirect } from "next/navigation";

/**
 * Folded into the main data log (18 Sep, Kennedy: "create a POS section
 * in the data log, so that I can see player requests") — this page's
 * content (player Contact Us / Request a Feature submissions, read from
 * P NOTIFICATIONS) now lives as a section inside app/admin/requests/
 * page.tsx instead of at this separate URL, so there's one data log
 * with both CHOS and POS requests rather than two pages to remember.
 * This route redirects there rather than being deleted outright, in
 * case Kennedy has this URL bookmarked.
 */
export default function PlayerRequests() {
  redirect("/admin/requests");
}
