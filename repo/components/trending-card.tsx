interface TrendingCardProps {
  headline: string;
  source: string;
  categoryLabel: string;
  publishedLabel: string;
  summary: string;
  whyItMatters: string;
  url: string;
}

/**
 * Trending Topics (Kennedy, 17 Aug) — tailored news cards under Workspace.
 * "why_it_matters" is shown inline, not behind a toggle: it's the whole
 * point of the section (news framed for the club's needs), so hiding it
 * would undersell it. Read link opens the source externally.
 */
export function TrendingCard({
  headline,
  source,
  categoryLabel,
  publishedLabel,
  summary,
  whyItMatters,
  url,
}: TrendingCardProps) {
  return (
    <article className="trending-card">
      <div className="trending-card-meta">
        <span className="chip trending-card-category">{categoryLabel}</span>
        <span className="trending-card-source">
          {source} · {publishedLabel}
        </span>
      </div>
      <h3 className="trending-card-headline">{headline}</h3>
      <p className="trending-card-summary">{summary}</p>
      <div className="trending-why">
        <span className="trending-why-label">Why it matters for you</span>
        <p>{whyItMatters}</p>
      </div>
      <a className="btn btn-black trending-card-read" href={url} target="_blank" rel="noopener noreferrer">
        Read the full story
      </a>
    </article>
  );
}
