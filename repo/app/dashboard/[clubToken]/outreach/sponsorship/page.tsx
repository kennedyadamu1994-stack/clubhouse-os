import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { matchScore } from "@/lib/scoring";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

export default async function SponsorshipOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [sponsorships, actions, weights] = await Promise.all([
    db.getSponsorships(),
    db.getActionsForClub(club.club_id),
    getScoreWeights(),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  // Match score always computes now (priorities removed, 20 Aug) — sort by
  // match first, closing date as the tiebreaker.
  const initialOrder = [...sponsorships].sort((a, b) => {
    const diff = matchScore(club, a, weights) - matchScore(club, b, weights);
    if (diff !== 0) return -diff;
    return new Date(a.closing_date).getTime() - new Date(b.closing_date).getTime();
  });

  const tags = Array.from(new Set(sponsorships.flatMap((s) => s.eligibility_tags))).sort();

  const entries: OutreachEntry[] = initialOrder.map((sp) => {
    const score = matchScore(club, sp, weights);
    const complex = /grant|active communities/i.test(sp.title) || sp.eligibility_tags.length > 2;
    // "Closing soon" sorts ascending by days-until-close, so it needs to be
    // the biggest number for the SOONEST deadline (OutreachList sorts
    // descending) — invert by days remaining, floored at 0.
    const daysUntilClose = Math.max(
      0,
      Math.ceil((new Date(sp.closing_date).getTime() - Date.now()) / 86_400_000),
    );
    return {
      key: sp.opportunity_id,
      searchText: [sp.title, sp.provider, sp.amount, sp.eligibility_tags.join(" "), sp.description].join(" "),
      filterValues: { tag: sp.eligibility_tags[0] ?? "" },
      sortValues: {
        ...(score != null ? { match: score } : {}),
        closing: 100_000 - daysUntilClose, // soonest deadline = highest value = sorts first
      },
      nameForSort: sp.title,
      sponsored: sp.sponsored,
      card: (
        <EntryCard
          key={sp.opportunity_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={sp.opportunity_id}
          initials={sp.provider.slice(0, 2).toUpperCase()}
          imageUrl={sp.image_url}
          title={sp.title}
          subtitle={`${sp.provider} · ${sp.amount}`}
          tags={[
            ...sp.eligibility_tags,
            `Closes ${new Date(sp.closing_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          ]}
          matchScore={score}
          isNew={isRecent(sp.created_at)}
          sponsored={sp.sponsored}
          detail={[
            { label: "Provider", value: sp.provider },
            { label: "Amount", value: sp.amount },
            {
              label: "Closing date",
              value: new Date(sp.closing_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            },
            { label: "Description", value: sp.description },
          ]}
          actions={[
            { action_key: "apply_yourself", label: `Apply for this yourself`, colour: "black", token_cost: 0, href: sp.apply_url },
            {
              action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
              label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
              colour: "pink",
              token_cost: complex ? 3 : 2,
            },
          ]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Sponsorship & Funding <span className="count-badge">{sponsorships.length} opportunities</span>
      </h2>
      {sponsorships.length === 0 ? (
        <EmptyState
          message="No funding opportunities listed yet — we're adding more every week."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search funding by title, provider, or eligibility…"
          filters={[{ key: "tag", label: "Eligibility", values: tags }]}
          sortOptions={[
            { key: "match", label: "Best match" },
            { key: "closing", label: "Closing soonest" },
            { key: "name", label: "Name (A–Z)" },
          ]}
          defaultSort="match"
        />
      )}
    </div>
  );
}
