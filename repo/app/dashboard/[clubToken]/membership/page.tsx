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

  const [{ balance, allocation }, plans] = await Promise.all([
    db.getTokenBalance(club.club_id),
    db.getPlans(),
  ]);

  return (
    <MembershipBody club={club} clubToken={clubToken} balance={balance} allocation={allocation} plans={plans} />
  );
}
