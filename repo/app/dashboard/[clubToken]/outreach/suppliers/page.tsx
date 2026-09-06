import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { isRecent } from "@/lib/dates";
import { EntryCard } from "@/components/entry-card";
import { EmptyState } from "@/components/empty-state";
import { OutreachList, type OutreachEntry } from "@/components/outreach-list";

/**
 * Outreach subsection sourced from the real "KIT" worksheet — see
 * lib/types.ts's Supplier interface for the full column mapping and
 * lib/data/sheets.ts's getSuppliers() for how each real column is read.
 *
 * Hidden entirely for Free (Kennedy, 1 Sep — reverses the 27 Aug decision
 * that had opened this up: "completely remove the padlocked and locked
 * elements for the free version"). Free's Outreach is now limited to
 * Players/Clubs/Sponsorship & Funding only.
 *
 * No match score here — unlike Players/Brands/etc., a supplier's fit
 * isn't meaningfully scored against a club's sport/area/goals the way
 * matchScore() computes it elsewhere; this is a browse-and-contact
 * catalogue, filtered by product category and delivery area instead.
 *
 * internal_notes ("U notes" on the sheet) is deliberately never rendered
 * here — it's Kennedy's own private note on the supplier, not club-facing
 * content (see the Supplier type's own doc comment).
 */
export default async function SuppliersOutreach({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();
  // Blocks direct URL access too, not just the nav link — see
  // outreach/layout.tsx's own note.
  if (club.plan_tier === "free") notFound();

  const [suppliers, actions] = await Promise.all([
    db.getSuppliers(),
    db.getActionsForClub(club.club_id),
  ]);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  const categories = Array.from(new Set(suppliers.flatMap((s) => s.product_categories))).sort();
  const areas = Array.from(new Set(suppliers.map((s) => s.delivery_area))).sort();

  const entries: OutreachEntry[] = suppliers.map((s) => {
    return {
      key: s.supplier_id,
      searchText: [
        s.name,
        s.product_categories.join(" "),
        s.brands_carried.join(" "),
        s.delivery_area,
        s.tags.join(" "),
      ].join(" "),
      filterValues: { category: s.product_categories[0] ?? "", area: s.delivery_area },
      sortValues: { credibility: s.credibility_score ?? -1 },
      nameForSort: s.name,
      sponsored: s.sponsored,
      card: (
        <EntryCard
          key={s.supplier_id}
          clubToken={clubToken}
          club_id={club.club_id}
          entryId={s.supplier_id}
          initials={s.name.slice(0, 2).toUpperCase()}
          imageUrl={s.image_url}
          title={s.name}
          subtitle={`${s.product_categories.join(", ") || "Supplier"} · ${s.delivery_area}`}
          tags={[]}
          isNew={isRecent(s.created_at)}
          sponsored={s.sponsored}
          credibilityScore={s.credibility_score}
          detail={[
            { label: "Product categories", value: s.product_categories.join(", ") || "—" },
            { label: "Brands carried", value: s.brands_carried.join(", ") || "—" },
            { label: "Price tier", value: s.price_tier || "—" },
            ...(s.bulk_discount ? [{ label: "Bulk/team discount", value: s.bulk_discount }] : []),
            ...(s.customization_offered ? [{ label: "Customisation offered", value: s.customization_offered }] : []),
            ...(s.sustainability_credentials
              ? [{ label: "Sustainability credentials", value: s.sustainability_credentials }]
              : []),
            ...(s.safeguarding_compliance
              ? [{ label: "Safeguarding compliance", value: s.safeguarding_compliance }]
              : []),
            { label: "Sample available", value: s.sample_available ? "Yes" : "No" },
            ...(s.lead_time ? [{ label: "Lead time", value: s.lead_time }] : []),
            ...(s.minimum_order ? [{ label: "Minimum order", value: s.minimum_order }] : []),
            { label: "Delivery area", value: s.delivery_area || "—" },
            ...(s.past_grassroots_clients
              ? [{ label: "Past grassroots clients", value: s.past_grassroots_clients }]
              : []),
            ...(s.verification_status
              ? [{ label: "Verification", value: s.verification_status }]
              : []),
          ]}
          consentNote={
            s.contact
              ? undefined
              : "Direct contact isn't listed for this supplier, let The NBRH make the introduction."
          }
          actions={[
            ...(s.source_url
              ? [{ action_key: "visit_website", label: `Visit ${s.name}'s website`, colour: "black" as const, token_cost: 0, href: s.source_url }]
              : []),
            { action_key: "supplier_outreach", label: `We'll reach out to ${s.name} for you`, colour: "pink" as const, token_cost: 1 },
          ]}
          isFirstTokenEncounter={isFirstToken}
        />
      ),
    };
  });

  return (
    <div className="card outreach-card">
      <h2>
        Suppliers <span className="count-badge">{suppliers.length} listed</span>
      </h2>

      {suppliers.length === 0 ? (
        <EmptyState
          message="No suppliers listed yet, we're adding more every week."
          cta="Contact us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <OutreachList
          entries={entries}
          placeholder="Search suppliers by name, product, or area…"
          filters={[
            { key: "category", label: "Category", values: categories },
            { key: "area", label: "Delivery area", values: areas },
          ]}
          sortOptions={[
            { key: "credibility", label: "Most credible" },
            { key: "name", label: "Name (A–Z)" },
          ]}
        />
      )}
    </div>
  );
}
