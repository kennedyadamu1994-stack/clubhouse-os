import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { MembershipBody } from "@/components/membership-body";

/**
 * Membership's own standalone page. Body lives in components/membership-body.tsx
 * so it's shared with the Membership dropdown embedded in Overview (Kennedy's
 * request, 19 Aug: still has its own page, also collapsible inside Overview).
 */
export default async function Membership({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const { balance, allocation } = await db.getTokenBalance(club.club_id);

  return (
    <MembershipBody club={club} clubToken={clubToken} balance={balance} allocation={allocation} />
  );
}
