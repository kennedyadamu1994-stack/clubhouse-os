import { notFound } from "next/navigation";
import { getAdapter, getScoreWeights } from "@/lib/data";
import { profileCompleteness, topRecommendations } from "@/lib/scoring";
import { EmptyState } from "@/components/empty-state";
import { CollapsibleCard } from "@/components/collapsible-card";
import { MatchScoreBadge } from "@/components/match-score-badge";
import { MembershipBody } from "@/components/membership-body";
import { ClubHealthCard } from "@/components/club-health-card";
import { SeeMoreActionsButton } from "@/components/see-more-actions-button";
import { RecommendationActionButton } from "@/components/recommendation-action-button";
import { OverviewSearchBar, type SearchIndexEntry } from "@/components/overview-search-bar";

export default async function Overview({ params }: { params: Promise<{ clubToken: string }> }) {
  const { clubToken } = await params;
  const db = getAdapter();
  const club = await db.getClubByToken(clubToken);
  if (!club) notFound();

  const [
    weights,
    sponsorships,
    opportunities,
    players,
    actions,
    asOf,
    balanceInfo,
    plans,
    nbrhUpdates,
    resources,
    faq,
    people,
    brands,
    influencers,
    directory,
    suppliers,
    socialVenues,
    perks,
    trending,
    services,
  ] = await Promise.all([
    getScoreWeights(),
    db.getSponsorships(),
    db.getOpportunities(),
    db.getPlayers(),
    db.getActionsForClub(club.club_id),
    db.dataAsOf(),
    db.getTokenBalance(club.club_id),
    db.getPlans(),
    db.getNbrhUpdates(),
    db.getResources(),
    db.getFaq(),
    db.getPeople(),
    db.getBrands(),
    db.getInfluencers(),
    db.getClubsDirectory(),
    db.getSuppliers(),
    db.getSocialVenues(),
    db.getPerks(),
    db.getTrendingTopics(),
    db.getServices(),
  ]);

  const completeness = profileCompleteness(club);
  const recs = topRecommendations(club, sponsorships, opportunities, players, weights);
  const isFirstToken = actions.filter((a) => a.type === "action").length === 0;
  const spent = actions
    .filter((a) => a.type === "action" && a.status !== "cancelled")
    .reduce((n, a) => n + a.token_cost, 0);
  const base = `/dashboard/${clubToken}`;

  // Universal search index — searches across every entity type in the OS
  // (Kennedy's request, 27 Aug fifth follow-up: "can the search bar in
  // overview search all elements from the OS?"). Player and Person
  // entries use the same privacy-respecting title as their own Outreach
  // pages ("Player in <area>" / "<Role> in <area>", never the real name
  // — see gatePlayer/gatePerson's own doc comments in lib/data/index.ts)
  // since both are always anonymised regardless of where they're
  // surfaced. ROLE_LABEL/TYPE_LABEL are duplicated from
  // outreach/people/page.tsx and outreach/brands/page.tsx respectively
  // rather than extracted into a shared constant, since they're small,
  // stable label maps and duplicating a few lines is lower-risk than a
  // cross-file refactor.
  const ROLE_LABEL: Record<string, string> = {
    coach: "Coach",
    referee: "Referee",
    photographer: "Photographer",
    videographer: "Videographer",
    statistician: "Statistician",
    graphic_designer: "Graphic designer",
    copywriter: "Copywriter",
    pt: "PT",
  };
  const BRAND_TYPE_LABEL: Record<string, string> = {
    local_shop: "Local shop",
    big_brand: "Big brand",
    corporate: "Corporate",
  };
  const SERVICE_CATEGORY_LABEL: Record<string, string> = {
    monetisation: "Monetisation",
    social_media: "Social Media",
    content_creation: "Content Creation",
    paid_social_media: "Paid Social Media",
    copywriting: "Copywriting",
    strategy_consultancy: "Strategy Consultancy",
    ad_hoc: "Ad Hoc",
    digital_infrastructure: "Digital Infrastructure",
  };
  const RESOURCE_CATEGORY_LABEL: Record<string, string> = {
    marketing: "Marketing",
    strategy: "Strategy",
    digital: "Digital",
    monetisation: "Monetisation",
  };
  const RESOURCE_FORMAT_LABEL: Record<string, string> = {
    article: "Article",
    video: "Video",
    link: "Link",
    report: "Report",
  };
  const PERK_CATEGORY_LABEL: Record<string, string> = {
    equipment: "Equipment",
    food_drink: "Food & Drink",
    software: "Software",
    training: "Training",
    travel: "Travel",
    wellbeing: "Wellbeing",
  };
  const TRENDING_CATEGORY_LABEL: Record<string, string> = {
    funding: "Funding",
    grassroots: "Grassroots",
    marketing: "Marketing",
    policy: "Policy",
    community: "Community",
    digital: "Digital",
  };

  const searchIndex: SearchIndexEntry[] = [
    ...players.map((p) => {
      const title = p.name ?? `Player in ${p.area}`;
      const subtitle = p.sports.join(", ");
      return {
        id: `player-${p.player_id}`,
        title,
        subtitle,
        category: "Player" as const,
        href: `${base}/outreach/players`,
        actions: [{ action_key: "player_invite", label: "Invite them to trial with us", colour: "pink" as const, token_cost: 1 }],
        searchText: [title, subtitle, p.area, p.interests.join(" "), p.level].join(" ").toLowerCase(),
      };
    }),
    ...people.map((p) => {
      const roleLabel = ROLE_LABEL[p.role] ?? p.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const title = p.name ?? `${roleLabel} in ${p.area}`;
      return {
        id: `person-${p.person_id}`,
        title,
        subtitle: `${roleLabel} · ${p.area}`,
        category: "Person" as const,
        href: `${base}/outreach/people`,
        actions: [
          ...(p.direct_contact_url
            ? [{ action_key: "contact_directly", label: `Book ${p.name ?? `this ${roleLabel.toLowerCase()}`} yourself`, colour: "black" as const, token_cost: 0, href: p.direct_contact_url }]
            : []),
          { action_key: "person_request", label: `Book this ${roleLabel.toLowerCase()}`, colour: "pink" as const, token_cost: 2 },
        ],
        searchText: [title, roleLabel, p.area, p.sports.join(" ")].join(" ").toLowerCase(),
      };
    }),
    ...brands.map((b) => ({
      id: `brand-${b.brand_id}`,
      title: b.name,
      subtitle: BRAND_TYPE_LABEL[b.type] ?? b.type,
      category: "Brand" as const,
      href: `${base}/outreach/brands`,
      detail: b.partnership_interests.length ? `Interested in: ${b.partnership_interests.join(", ")}` : undefined,
      actions: [
        ...(b.website
          ? [{ action_key: "visit_website", label: `Visit ${b.name}'s website`, colour: "black" as const, token_cost: 0, href: b.website }]
          : []),
        {
          action_key: b.type === "corporate" ? "brand_outreach_corporate" : "brand_outreach_local",
          label: `We'll pitch ${b.name} for you`,
          colour: "pink" as const,
          token_cost: 3,
        },
      ],
      searchText: [b.name, BRAND_TYPE_LABEL[b.type] ?? b.type, b.area, b.sectors.join(" "), b.partnership_interests.join(" ")]
        .join(" ")
        .toLowerCase(),
    })),
    ...influencers.map((i) => ({
      id: `influencer-${i.influencer_id}`,
      title: i.name,
      subtitle: i.niches.join(", "),
      category: "Influencer" as const,
      href: `${base}/outreach/influencers`,
      actions: [
        ...(i.direct_contact_url
          ? [{ action_key: "contact_directly", label: `Message ${i.name.replace("@", "")} yourself`, colour: "black" as const, token_cost: 0, href: i.direct_contact_url }]
          : []),
        { action_key: "influencer_outreach", label: `We'll reach out to ${i.name.replace("@", "")}`, colour: "pink" as const, token_cost: 3 },
      ],
      searchText: [i.name, i.area, i.platforms.join(" "), i.niches.join(" ")].join(" ").toLowerCase(),
    })),
    ...sponsorships.map((s) => {
      const complex = /grant|active communities/i.test(s.title) || s.eligibility_tags.length > 2;
      return {
        id: `sponsorship-${s.opportunity_id}`,
        title: s.title,
        subtitle: s.provider,
        category: "Sponsorship" as const,
        href: `${base}/outreach/sponsorship`,
        detail: s.description || undefined,
        actions: [
          ...(s.apply_url
            ? [{ action_key: "apply_yourself", label: "Apply for this yourself", colour: "black" as const, token_cost: 0, href: s.apply_url }]
            : []),
          {
            action_key: complex ? "sponsorship_apply_complex" : "sponsorship_apply",
            label: s.amount ? `Get us this ${s.amount}` : "Apply on our behalf",
            colour: "pink" as const,
            token_cost: 3,
          },
        ],
        searchText: [s.title, s.provider, s.amount, s.eligibility_tags.join(" "), s.description].join(" ").toLowerCase(),
      };
    }),
    // Self-excluded (a club never searches up its own directory row) —
    // same fix as outreach/clubs/page.tsx's own directory listing.
    ...directory
      .filter((c) => c.directory_id !== club.club_id)
      .map((c) => ({
        id: `club-${c.directory_id}`,
        title: c.name,
        subtitle: `${c.sport} · ${c.area}`,
        category: "Club" as const,
        href: `${base}/outreach/clubs`,
        actions: [
          ...(c.public_contact_url
            ? [{ action_key: "reach_out_yourself", label: `Message ${c.name} yourself`, colour: "black" as const, token_cost: 0, href: c.public_contact_url }]
            : []),
          { action_key: "club_outreach", label: `We'll set it up with ${c.name}`, colour: "pink" as const, token_cost: 2 },
        ],
        searchText: [c.name, c.sport, c.area, c.open_to.join(" ")].join(" ").toLowerCase(),
      })),
    ...suppliers.map((s) => ({
      id: `supplier-${s.supplier_id}`,
      title: s.name,
      subtitle: s.product_categories.join(", "),
      category: "Supplier" as const,
      href: `${base}/outreach/suppliers`,
      detail: s.brands_carried.length ? `Carries: ${s.brands_carried.join(", ")}` : undefined,
      actions: [
        ...(s.source_url
          ? [{ action_key: "visit_website", label: `Visit ${s.name}'s website`, colour: "black" as const, token_cost: 0, href: s.source_url }]
          : []),
        { action_key: "supplier_outreach", label: `We'll reach out to ${s.name} for you`, colour: "pink" as const, token_cost: 1 },
      ],
      searchText: [s.name, s.product_categories.join(" "), s.brands_carried.join(" "), s.delivery_area, s.tags.join(" ")]
        .join(" ")
        .toLowerCase(),
    })),
    ...socialVenues.map((v) => ({
      id: `venue-${v.venue_id}`,
      title: v.name,
      subtitle: v.venue_type,
      category: "Social Venue" as const,
      href: `${base}/outreach/social-venues`,
      detail: v.venue_description_short || undefined,
      actions: [
        ...(v.booking_url
          ? [{ action_key: "reach_out_yourself", label: `Book ${v.name} yourself`, colour: "black" as const, token_cost: 0, href: v.booking_url }]
          : v.website_url
            ? [{ action_key: "reach_out_yourself", label: `Visit ${v.name}'s website`, colour: "black" as const, token_cost: 0, href: v.website_url }]
            : []),
        { action_key: "club_outreach", label: `We'll set it up with ${v.name}`, colour: "pink" as const, token_cost: 2 },
      ],
      searchText: [v.name, v.venue_type, v.borough ?? "", v.postcode ?? "", v.best_for.join(" "), v.tags.join(" ")]
        .join(" ")
        .toLowerCase(),
    })),
    ...opportunities
      .filter((o) => o.status === "open")
      .map((o) => {
        const isCallout = o.type === "callout";
        return {
          id: `opp-${o.opportunity_id}`,
          title: o.title,
          subtitle: o.type,
          category: "Opportunity" as const,
          href: `${base}/workspace/opportunities`,
          actions: isCallout
            ? [{ action_key: "contact_us", label: `Offer to help with "${o.title}"`, colour: "pink" as const, token_cost: 0 }]
            : [
                ...(o.link
                  ? [{ action_key: "view_opportunity", label: "See the full listing", colour: "black" as const, token_cost: 0, href: o.link }]
                  : []),
                { action_key: "contact_us", label: `Ask us about "${o.title}"`, colour: "pink" as const, token_cost: 0 },
              ],
          searchText: [o.title, o.type, o.area, o.tags.join(" ")].join(" ").toLowerCase(),
        };
      }),
    ...resources.map((r) => ({
      id: `res-${r.resource_id}`,
      title: r.title,
      subtitle: RESOURCE_CATEGORY_LABEL[r.category] ?? r.category,
      category: "Resource" as const,
      href: `${base}/workspace/resources`,
      detail: r.summary || undefined,
      actions: r.url
        ? [{ action_key: "view_resource", label: `Open the ${(RESOURCE_FORMAT_LABEL[r.format] ?? r.format).toLowerCase()}`, colour: "black" as const, token_cost: 0, href: r.url }]
        : undefined,
      searchText: [r.title, RESOURCE_CATEGORY_LABEL[r.category] ?? r.category, r.summary].join(" ").toLowerCase(),
    })),
    ...faq.map((f) => ({
      id: `faq-${f.faq_id}`,
      title: f.question,
      subtitle: f.category,
      category: "FAQ" as const,
      href: `${base}/workspace/faq`,
      detail: f.answer || undefined,
      searchText: [f.question, f.answer, f.category].join(" ").toLowerCase(),
    })),
    ...perks
      .filter((p) => p.active)
      .map((p) => ({
        id: `perk-${p.perk_id}`,
        title: p.title,
        subtitle: p.partner,
        category: "Perk" as const,
        href: `${base}/workspace/perks`,
        detail: [p.offer, p.description].filter(Boolean).join(" — ") || undefined,
        searchText: [p.title, p.partner, PERK_CATEGORY_LABEL[p.category] ?? p.category, p.description, p.offer]
          .join(" ")
          .toLowerCase(),
      })),
    ...trending.map((t) => ({
      id: `trending-${t.topic_id}`,
      title: t.headline,
      subtitle: TRENDING_CATEGORY_LABEL[t.category] ?? t.category,
      category: "Trending" as const,
      href: `${base}/workspace/trending`,
      detail: t.summary || undefined,
      searchText: [t.headline, TRENDING_CATEGORY_LABEL[t.category] ?? t.category, t.source, t.summary].join(" ").toLowerCase(),
    })),
    ...services
      .filter((s) => s.active)
      .map((s) => ({
        id: `service-${s.service_id}`,
        title: s.name,
        subtitle: SERVICE_CATEGORY_LABEL[s.category] ?? s.category,
        category: "Service" as const,
        href: `${base}/services`,
        detail: s.description || undefined,
        searchText: [s.name, SERVICE_CATEGORY_LABEL[s.category] ?? s.category, s.description, s.offers.join(" ")]
          .join(" ")
          .toLowerCase(),
      })),
    // Tools — a small static list (name + destination), matching the
    // search bar's own placeholder text ("...tools…") by letting a club
    // jump straight to a tool by typing its name.
    { id: "tool-contact", title: "Contact Us", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/contact`, searchText: "contact us tool support help" },
    { id: "tool-search", title: "Search (The NBRH Engine)", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/search`, searchText: "search engine sessions clubs leagues venues events tool" },
    { id: "tool-map", title: "Map", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/map`, searchText: "map location venues tool" },
    { id: "tool-calendar", title: "Calendar", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/calendar`, searchText: "calendar events dates schedule tool" },
    { id: "tool-insights", title: "What's happening", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/insights`, searchText: "insights whats happening session tool" },
    { id: "tool-copy", title: "Copy Generator", subtitle: "Tool", category: "Tool" as const, href: `${base}/tools/copy-generator`, searchText: "copy generator writing captions tool" },
  ];

  return (
    <>
      <OverviewSearchBar
        index={searchIndex}
        clubToken={clubToken}
        club_id={club.club_id}
        isFirstTokenEncounter={isFirstToken}
      />

      <div className="grid">
        {/* Club Health — replaces Profile completeness entirely (Kennedy's
            request, 20 Aug). Five real values from DASHBOARD (X)'s CHP1-5
            columns. Falls back to the old completeness-based display only
            when club_health is absent (local/demo adapter has no seed data
            for it yet) — never shows broken/zeroed bars. */}
        <CollapsibleCard id="club-health" heading="Club Health">
          {club.club_health ? (
            <ClubHealthCard health={club.club_health} />
          ) : (
            <>
              <div className="stat">{completeness}%</div>
              <p className="stat-label">
                {club.triage_complete
                  ? "Based on your club triage."
                  : "Your full club health score arrives once it's set up in the database."}
              </p>
            </>
          )}
        </CollapsibleCard>

        {/* KPIs — visual language matches the reference "Performance" cards (accent top
            border, serif-styled name, card grid) but doesn't fabricate a target/current/
            status/progress-bar the app has no real data for (club.kpis is just a list of
            goal names, not numeric metrics) — see DECISIONS.md-adjacent note in
            CLAUDE.md rule 1: shown data must be real, never invented to fill a visual
            template. */}
        <CollapsibleCard id="kpis" heading="Your KPIs">
          {club.kpis.length > 0 ? (
            <div className="kpi-grid">
              {club.kpis.map((kpi, i) => {
                // kpi.value/target are raw strings — try a numeric progress
                // bar when both parse cleanly as numbers (strips £/,/% for
                // the comparison only; display keeps the original text).
                const numericValue = kpi.value ? Number(kpi.value.replace(/[£,%\s]/g, "")) : null;
                const numericTarget = kpi.target ? Number(kpi.target.replace(/[£,%\s]/g, "")) : null;
                const canShowProgress =
                  numericValue != null && !Number.isNaN(numericValue) &&
                  numericTarget != null && !Number.isNaN(numericTarget) && numericTarget > 0;
                const progressPct = canShowProgress
                  ? Math.min(100, Math.round((numericValue! / numericTarget!) * 100))
                  : null;

                return (
                  <div className="kpi-card" key={kpi.name}>
                    <span className="kpi-index">KPI {String(i + 1).padStart(2, "0")}</span>
                    <div className="kpi-name">{kpi.name}</div>
                    {kpi.value ? (
                      <>
                        <div className="kpi-value">
                          {kpi.value}
                          {kpi.target && <span className="kpi-target">of {kpi.target}</span>}
                        </div>
                        {progressPct != null && (
                          <div className="kpi-progress-track">
                            <div className="kpi-progress-fill" style={{ width: `${progressPct}%` }} />
                          </div>
                        )}
                      </>
                    ) : kpi.target ? (
                      <div className="kpi-value kpi-value-target-only">
                        <span className="kpi-target-label">Target</span>
                        {kpi.target}
                      </div>
                    ) : (
                      <div className="kpi-tracking">Tracking</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              KPIs will appear here once they&apos;re set for your club.
            </p>
          )}
        </CollapsibleCard>

        {/* Top 5 recommendations with match scores — colour-scale badge, not the old flat pink chip */}
        <CollapsibleCard
          id="recs"
          defaultOpen={false}
          heading={
            <>
              Top recommendations
              {recs.length > 0 && <span className="count-badge">matched to your goals</span>}
            </>
          }
        >
          {recs.length > 0 ? (
            <div>
              {recs.map((r) => (
                <div className="rec" key={`${r.kind}-${r.id}`}>
                  <MatchScoreBadge score={r.score} />
                  <div className="rec-body">
                    <div className="rec-title">{r.title}</div>
                    <div className="rec-sub">{r.subtitle}</div>
                  </div>
                  <RecommendationActionButton
                    rec={r}
                    clubToken={clubToken}
                    club_id={club.club_id}
                    isFirstTokenEncounter={isFirstToken}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              No recommendations yet — check back as more funding, opportunities, and players are
              added.
            </p>
          )}
        </CollapsibleCard>

        {/* Action tracker */}
        <CollapsibleCard
          id="actions"
          defaultOpen={false}
          heading={
            <>
              Your actions <span className="count-badge">{actions.length} logged</span>
            </>
          }
        >
          {actions.length > 0 ? (
            <>
              {actions.slice(0, 5).map((a) => (
                <div className="log-row" key={a.log_id}>
                  <div>
                    <div>{a.notes || a.action_key.replaceAll("_", " ")}</div>
                    <div className="log-meta">
                      {new Date(a.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {a.token_cost} token{a.token_cost === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className={`status ${a.status}`}>{a.status}</span>
                </div>
              ))}
              <p className="log-meta" style={{ marginTop: 12, color: "var(--dim)" }}>
                {spent} of {balanceInfo.allocation} tokens used
              </p>
              {actions.length > 5 && <SeeMoreActionsButton actions={actions} />}
            </>
          ) : (
            <EmptyState
              message="Actions you take will be tracked here — starting with your first outreach."
              cta="Explore what you can do"
              href={base}
            />
          )}
        </CollapsibleCard>

        {/* Membership — moved from its own top-level nav item into a collapsible
            dropdown here (Kennedy's request, 19 Aug), while still keeping its
            own page at /membership (linked below) for anyone who wants a
            direct, shareable URL. Reuses balanceInfo already fetched above
            rather than querying the ledger twice. */}
        <CollapsibleCard id="membership" heading="Membership" defaultOpen={false}>
          <MembershipBody
            club={club}
            clubToken={clubToken}
            balance={balanceInfo.balance}
            allocation={balanceInfo.allocation}
            plans={plans}
          />
        </CollapsibleCard>

        {/* Connected Pages — directory of this club's existing dedicated pages
            elsewhere (session/booking, club profile, league). Kennedy's
            request, 19 Aug. Data lives on Club.connected_pages, eventually
            sourced from the DASHBOARD (X) sheet — for now seeded per-club in
            data/clubs.json since only the demo club has real URLs. Renders
            nothing at all when a club has none, rather than showing an empty
            card or placeholder links (CLAUDE.md rule 4 cuts both ways: no
            dead ends, but also no dead/fake links). */}
        {club.connected_pages && club.connected_pages.length > 0 && (
          <CollapsibleCard id="connected-pages" defaultOpen={false} heading="Connected Pages">
            <div className="connected-pages-grid">
              {club.connected_pages.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="connected-page-box">
                  <span className="connected-page-label">{p.label}</span>
                  <span className="connected-page-cta">Open page ↗</span>
                </a>
              ))}
            </div>
          </CollapsibleCard>
        )}

        {/* From The NBRH — real feed from CHOS Workspace's "FROM THE NBRH"
            tab (Kennedy's request, 25 Aug: this was never actually wired
            up before — community_note on Club was hardcoded to an empty
            string). All rows shown as a feed, newest first, per Kennedy's
            decision. */}
        <CollapsibleCard id="note" className="note-card" defaultOpen={false} heading="From The NBRH">
          {nbrhUpdates.length > 0 ? (
            <div className="nbrh-updates">
              {nbrhUpdates.map((u) => (
                <div className="nbrh-update" key={u.update_id}>
                  <p className="nbrh-update-note">{u.note}</p>
                  <div className="nbrh-update-meta">
                    <span>
                      {new Date(u.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {u.url && (
                      <a href={u.url} target="_blank" rel="noopener noreferrer">
                        Read more →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--dim)" }}>
              Updates from The NBRH will appear here as your neighbourhood grows.
            </p>
          )}
        </CollapsibleCard>
      </div>

      <p className="asof">
        Data as of{" "}
        {new Date(asOf).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </>
  );
}
