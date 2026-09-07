import { notFound } from "next/navigation";
import { getAdapter } from "@/lib/data";
import { EmptyState } from "@/components/empty-state";
import { FaqList } from "@/components/faq-list";

export default async function Faq({
  params,
}: {
  params: Promise<{ clubToken: string }>;
}) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const faq = await db.getFaq();
  const base = `/dashboard/${clubToken}`;

  return (
    <div className="card outreach-card">
      <h2>
        FAQ <span className="count-badge">{faq.length} answers</span>
      </h2>

      {faq.length === 0 ? (
        <EmptyState
          message="No FAQ entries yet, use Contact Us if you have a question."
          cta="Contact us"
          href={base}
        />
      ) : (
        <FaqList faq={faq} />
      )}
    </div>
  );
}
