import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { ServiceCard } from "@/components/service-card";
import { EmptyState } from "@/components/empty-state";

const CATEGORY_LABEL: Record<string, string> = {
  monetisation: "Monetisation",
  social_media: "Social Media",
  content_creation: "Content Creation",
  paid_social_media: "Paid Social Media",
  copywriting: "Copywriting",
  strategy_consultancy: "Strategy Consultancy",
  ad_hoc: "Ad Hoc",
  digital_infrastructure: "Digital Infrastructure",
};

export default async function Services({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [allServices, actions] = await Promise.all([
    db.getServices(),
    db.getActionsForClub(club.club_id),
  ]);
  // Inactive services (docs/sections/03-05 § Section 5) don't render — same
  // active-flag convention as Tokens_Reference, filtered at point of use
  // rather than in the getter, so a future admin view can still read every
  // row including inactive ones.
  const services = allServices.filter((s) => s.active);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <h2>
        Services <span className="count-badge">{services.length} available</span>
      </h2>
      <p style={{ color: "var(--dim)", fontSize: "0.9rem", marginTop: -8, marginBottom: 20, maxWidth: "56ch" }}>
        Paid support from The NBRH, priced per hour. Getting in touch is always free — you&apos;re
        only ever charged for the hours you actually book.
      </p>

      {services.length === 0 ? (
        <EmptyState
          message="No services listed right now — get in touch and we'll help however we can."
          cta="Contact Us"
          href={`${base}/tools/contact`}
        />
      ) : (
        <div className="cardgrid service-cardgrid">
          {services.map((s) => (
            <ServiceCard
              key={s.service_id}
              clubToken={clubToken}
              club_id={club.club_id}
              serviceId={s.service_id}
              name={s.name}
              categoryLabel={CATEGORY_LABEL[s.category] ?? s.category}
              description={s.description}
              hourlyRateGbp={s.hourly_rate_gbp}
              isFirstTokenEncounter={isFirstToken}
            />
          ))}
        </div>
      )}
    </div>
  );
}
