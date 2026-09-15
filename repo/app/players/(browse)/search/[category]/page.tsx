import { NbrhEngine } from "@/components/nbrh-engine";
import { categoryFromSlug } from "@/lib/players/search-category";

/**
 * POS Search — the real split into per-category routes Kennedy asked
 * for (15 Sep: "instead of the self contained tool, it utilises the
 * drop down bar to change pages"). NbrhEngine itself is completely
 * unmodified in its actual filter/sort/list-view logic — only its tab
 * bar switches from setCategory() buttons to real links when linkBase
 * is passed (see NbrhEngineProps' own doc comment). showPeople=true is
 * the other real difference from CHOS's own /tools/search page, which
 * never passes it — People is one of the categories Kennedy listed for
 * POS's search but was never shown on CHOS.
 */
export default async function PublicSearch({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = categoryFromSlug(slug);

  return (
    <div className="card outreach-card">
      <h2>Search</h2>
      <p style={{ color: "var(--dim)", fontSize: "0.85rem", marginBottom: 20, maxWidth: "60ch" }}>
        The NBRH Engine: search activities, clubs, leagues, venues, people, and events across the
        whole platform.
      </p>
      <NbrhEngine initialCategory={category} showPeople linkBase="/players/search" />
    </div>
  );
}
