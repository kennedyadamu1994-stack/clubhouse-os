import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
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

  const [sponsorships, actions, favouritedKeys] = await Promise.all([
    db.getSponsorships(),
    db.getActionsForClub(club.club_id),
    db.getFavouritedKeys(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const tags = Array.from(new Set(sponsorships.flatMap((s) => s.eligibility_tags))).sort();

  const entries: OutreachEntry[] = sponsorships.map((sp) => {
    const complex = /grant|active communities/i.test(sp.title) || sp.eligibility_tags.length > 2;
    return {
      key: sp.opportunity_id,
      searchText: [sp.title, sp.provider, sp.amount, sp.eligibility_tags.join(" "), sp.description].join(" "),
      filterValues: { tag: sp.eligibility_tags[0] ?? "" },
      sortValues: { rating: sp.credibility_score ?? -1 },
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
          tags={[]}
          isNew={isRecent(sp.created_at)}
          sponsored={sp.sponsored}
          credibilityScore={sp.credibility_score}
          favouriteCategory="sponsorship"
          favouriteHref={`${base}/outreach/sponsorship`}
          favouritedKeys={favouritedKeys}
          detail={[
            ...(sp.provider ? [{ label: "Provider", value: sp.provider }] : []),
            ...(sp.amount ? [{ label: "Amount", value: sp.amount }] : []),
            // Shown as the plain, raw text from the sheet (8 Sep, Kennedy:
            // "just shows the plain text of whatever is in the relevant
            // cell") — real closing_date values use inconsistent date
            // formats across rows, so parsing via new Date() was
            // producing "Invalid Date" for many of them. This sidesteps
            // that entirely: whatever's actually in the cell is what
            // shows, correct by construction, never a parsing failure.
            ...(sp.closing_date ? [{ label: "Closing date", value: sp.closing_date }] : []),
            ...(sp.sports.length > 0 ? [{ label: "Sports", value: sp.sports.join(", ") }] : []),
            ...(sp.areas.length > 0 ? [{ label: "Areas", value: sp.areas.join(", ") }] : []),
            ...(sp.eligibility_tags.length > 0 ? [{ label: "Eligibility", value: sp.eligibility_tags.join(", ") }] : []),
            ...(sp.description ? [{ label: "Description", value: sp.description }] : []),
          ]}
          actions={[
            ...(sp.apply_url
              ? [{ action_key: "apply_yourself", label: `Apply for this yourself`, colour: "black" as const, token_cost: 0, href: sp.apply_url }]
              : []),
            {
              action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
              label: sp.amount ? `Get us this ${sp.amount}` : "Apply on our behalf",
              colour: "pink",
              token_cost: 3, // both simple and complex sponsorship applications now cost 3 (Kennedy, 27 Aug follow-up)
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
          message="No funding opportunities listed yet, we're adding more every week."
          cta="Contact us"
          href={club.plan_tier === "free" ? "https://thenbrh.co.uk" : `${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search funding by title, provider, or eligibility…"
          filters={[{ key: "tag", label: "Eligibility", values: tags }]}
          sortOptions={[
            { key: "rating", label: "Quality Rating" },
            { key: "name", label: "Name (A–Z)" },
          ]}
          defaultSort="name"
        />
      )}
    </div>
  );
}
