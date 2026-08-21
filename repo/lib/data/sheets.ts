import type {
  ActionLogRow,
  Brand,
  Club,
  ClubDirectoryEntry,
  Event,
  Faq,
  Influencer,
  Opportunity,
  Perk,
  Person,
  Player,
  Resource,
  Service,
  Sponsorship,
  TokenRef,
  TrendingTopic,
} from "../types";
import type { DataAdapter, SubmitActionInput, SubmitActionResult } from "./index";
import { LocalAdapter } from "./index";
import { PostgresAdapter } from "./postgres";
import { readTab, rowsToObjects, getLatestFetchAt } from "./sheets/client";
import { toBool, toList, toNumberOrNull, toNumber, combineKpiPairs, combineCalendarDate } from "./sheets/parse";

/**
 * Real Google Sheets adapter — reference/content data only. Built 20 Aug
 * against Kennedy's actual two spreadsheets (column headers + his own
 * section-mapping document), not against assumptions from lib/types.ts —
 * every mapping below traces to a specific decision made during that
 * reconciliation; see club-house-os memory for the full list.
 *
 * What this delegates instead of implementing directly:
 *   - The token ledger (getActionsForClub, getTokenBalance, submitAction,
 *     getAllActions, resetTokenBalance, setActionStatus, clearAllActions) →
 *     PostgresAdapter. Kennedy's own "LOGGED TASKS (X)" tab is a private
 *     reference sheet he doesn't want the app touching (20 Aug) — the real
 *     ledger stays exactly where it already was built and proven working.
 *   - Config and Tokens_Reference (internal tuning values — token costs per
 *     action, default allocation) → LocalAdapter. These were never part of
 *     Kennedy's sheet mapping; they're app-internal, not club-facing content.
 *   - Session data (Insights' platform-wide block, Search, Map) is already
 *     wired to a different, separate, already-live sheet
 *     (components/session-insights.tsx) — nothing to do here; confirmed
 *     with Kennedy 20 Aug this is intentional, not a gap.
 *
 * Two spreadsheets (see ./sheets/client.ts for the full tab list):
 *   MASTER_SHEET_ID    → "THE ULTIMATE NBRH CLUB HOUSE OS DATABASE"
 *   WORKSPACE_SHEET_ID → "CHOS Workspace"
 */
export class SheetsAdapter implements DataAdapter {
  private local = new LocalAdapter();
  private ledger = new PostgresAdapter();

  // --- ledger, delegated to Postgres (see file header) ---
  getActionsForClub = this.ledger.getActionsForClub.bind(this.ledger);
  getTokenBalance = this.ledger.getTokenBalance.bind(this.ledger);
  submitAction = (input: SubmitActionInput): Promise<SubmitActionResult> => this.ledger.submitAction(input);
  getAllActions = this.ledger.getAllActions.bind(this.ledger);
  resetTokenBalance = this.ledger.resetTokenBalance.bind(this.ledger);
  setActionStatus = this.ledger.setActionStatus.bind(this.ledger);
  clearAllActions = this.ledger.clearAllActions.bind(this.ledger);

  // --- internal config, delegated to Local (see file header) ---
  getTokensReference = this.local.getTokensReference.bind(this.local);
  getConfig = this.local.getConfig.bind(this.local);

  // ============================================================
  // Club — DASHBOARD (X), master sheet
  // ============================================================

  private async getAllClubs(): Promise<Club[]> {
    const rows = rowsToObjects(await readTab("master", "DASHBOARD (X)"));
    return rows.map((r) => this.rowToClub(r));
  }

  private rowToClub(r: Record<string, string | undefined>): Club {
    return {
      club_id: r["Club ID"] ?? "",
      club_token: r["Club ID"] ?? "", // DASHBOARD (X) has no separate token column — Club ID doubles as the URL token until Kennedy wants a distinct one
      name: r["Club Name"] ?? "",
      sport: r["Sport(s)"] ?? "",
      area: "", // no area/borough column on DASHBOARD (X) — Insights peer-comparison (sport+area match) is limited until this exists
      contact_name: r["Contact Name"] ?? "",
      contact_email: r["Contact Email"] ?? "",
      plan_tier: (r["Subscription Tier"]?.toLowerCase() === "premium" ? "premium" : "core"),
      goals: r["Goals"] ?? "",
      kpis: combineKpiPairs(r),
      members_count: toNumberOrNull(r["Members"]),
      teams_count: toNumberOrNull(r["Teams"]),
      community_note: "", // From The NBRH lives in CHOS Workspace's own tab, not here
      header_image_url: r["Header Image URL"] || null,
      logo_url: r["Logo URL"] || null,
      triage_complete: toBool(r["Onboarding Complete (Y/N)"]),
      created_at: r["Date Joined"] ?? new Date().toISOString().slice(0, 10),
      connected_pages: [
        r["Session Page"] ? { label: "Session Page", url: r["Session Page"]! } : null,
        r["Club Page"] ? { label: "Club Page", url: r["Club Page"]! } : null,
        r["League Page"] ? { label: "League Page", url: r["League Page"]! } : null,
      ].filter((p): p is { label: string; url: string } => p !== null),
      // Club Health — DASHBOARD (X) columns AD-AH (Kennedy's request, 20 Aug).
      club_health: {
        awareness: toNumber(r["CHP1: Awareness"], 0),
        user_reviews: toNumber(r["CHP2: User Reviews"], 0),
        nbrh_quality: toNumber(r["CHP3: NBRH Quality"], 0),
        management: toNumber(r["CHP4: Management"], 0),
        digital_infrastructure: toNumber(r["CHP5: Dig-Infra"], 0),
      },
    };
  }

  async getClubByToken(token: string): Promise<Club | null> {
    const clubs = await this.getAllClubs();
    return clubs.find((c) => c.club_token === token) ?? null;
  }

  async getAllClubsForDirectory(): Promise<Club[]> {
    return this.getAllClubs();
  }

  async getPeerCompletenessScores(club_id: string, sport: string, area: string): Promise<number[]> {
    const clubs = await this.getAllClubs();
    const { profileCompleteness } = await import("../scoring");
    return clubs
      .filter((c) => c.club_id !== club_id && c.sport === sport && (area ? c.area === area : true))
      .map((c) => profileCompleteness(c));
  }

  async dataAsOf(): Promise<string> {
    const t = getLatestFetchAt();
    return t ? new Date(t).toISOString() : new Date().toISOString();
  }

  // ============================================================
  // Player — NEIGHBOURS (O), master sheet
  // ============================================================

  private rowToPlayer(r: Record<string, string | undefined>, i: number): Player {
    return {
      player_id: r["record_id"] ?? `player_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      area: r["Home Borough"] ?? "",
      sports: toList(r["Favourite Activity"]),
      interests: toList(r["Other Activities Interested In"]),
      preferred_times: r["Availability"] ?? "",
      level: r["Experience Level"] ?? "",
      consent_share_name: false, // no longer used for the display gate (see gatePlayer in index.ts) — kept only for type shape
      name: r["Name"] ?? null, // real value here; getPlayers() below strips it via gatePlayer(), same as LocalAdapter
      gender: r["Gender"] ?? null,
      age: toNumberOrNull(r["Age"]),
    };
  }

  async getPlayers(): Promise<Player[]> {
    // gatePlayer() (index.ts) always nulls the name — never bypassed here.
    // Deliberately NOT reading into any OTHER field: Email, Date of Birth,
    // Disability Status, Phone, Height, Position, WhatsApp Consent,
    // Motivations — real columns on NEIGHBOURS (O) with sensitive personal
    // data this app has no use for and must never surface (20 Aug
    // reconciliation). Gender/Age ARE read now (Kennedy's decision, 20 Aug).
    const { gatePlayer } = await import("./index");
    const rows = rowsToObjects(await readTab("master", "NEIGHBOURS (O)"));
    return rows.map((r, i) => gatePlayer(this.rowToPlayer(r, i)));
  }

  async getPlayersUnfiltered(): Promise<Player[]> {
    // NOT gated — real names included. See interface doc comment (index.ts):
    // Kennedy's private admin datalog only, never a club-facing route.
    const rows = rowsToObjects(await readTab("master", "NEIGHBOURS (O)"));
    return rows.map((r, i) => this.rowToPlayer(r, i));
  }

  // ============================================================
  // Person — PEOPLE + CONTENT CREATORS, master sheet
  // ============================================================

  async getPeople(): Promise<Person[]> {
    const [peopleRows, creatorRows] = await Promise.all([
      readTab("master", "PEOPLE"),
      readTab("master", "CONTENT CREATORS"),
    ]);
    const people = rowsToObjects(peopleRows).map((r, i) => this.rowToPerson(r, i, "people"));
    const creators = rowsToObjects(creatorRows).map((r, i) => this.rowToPersonFromCreator(r, i));
    return [...people, ...creators];
  }

  private rowToPerson(r: Record<string, string | undefined>, i: number, prefix: string): Person {
    return {
      person_id: r["record_id"] ?? `${prefix}_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      role: (r["professional_type"]?.toLowerCase().replace(/\s+/g, "_") ?? "coach") as Person["role"],
      area: r["location"] ?? "",
      sports: toList(r["primary_sport"]),
      availability: r["availability"] ?? "",
      rate_note: r["Price_Per_Hour"] ? `£${r["Price_Per_Hour"]}/hr` : "",
      consent_share_name: true, // PEOPLE has no consent column — Kennedy's decision (20 Aug): People show real names normally, no gate
      name: r["name"] ?? null,
      image_url: r["image_url"] || r["Image URL"] || null,
    };
  }

  private rowToPersonFromCreator(r: Record<string, string | undefined>, i: number): Person {
    return {
      person_id: r["record_id"] ?? `creator_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      role: "videographer", // CONTENT CREATORS has no exact role-column match — closest existing PersonRole; Discipline goes in rate_note instead
      area: r["Location"] ?? "",
      sports: [],
      availability: r["Availability"] ?? "",
      rate_note: [r["Discipline"], r["Rate"]].filter(Boolean).join(" — "),
      consent_share_name: true,
      name: r["Name/Studio"] ?? null,
      image_url: r["Image URL"] || null,
    };
  }

  // ============================================================
  // Brand — BRANDS + BUSINESSES, master sheet
  // ============================================================

  async getBrands(): Promise<Brand[]> {
    const [brandRows, businessRows] = await Promise.all([
      readTab("master", "BRANDS"),
      readTab("master", "BUSINESSES"),
    ]);
    const brands = rowsToObjects(brandRows).map((r, i) => this.rowToBrand(r, i));
    const businesses = rowsToObjects(businessRows).map((r, i) => this.rowToBrandFromBusiness(r, i));
    return [...brands, ...businesses];
  }

  private rowToBrand(r: Record<string, string | undefined>, i: number): Brand {
    return {
      brand_id: r["record_id"] ?? `brand_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      name: r["Brand Name"] ?? "",
      type: "big_brand", // BRANDS has no local_shop/big_brand/corporate column — default; Industry/Category goes in sectors
      area: "", // BRANDS has no area column — unresolved 20 Aug reconciliation gap
      sectors: toList(r["Industry/Category"]),
      partnership_interests: toList(r["Partnership Type Sought"]),
      website: "", // not present on BRANDS
      consent_contact: true, // always contactable — Kennedy's decision, 20 Aug
      contact: r["Contact Email/LinkedIn"] || null,
      image_url: r["Image URL"] || null,
    };
  }

  private rowToBrandFromBusiness(r: Record<string, string | undefined>, i: number): Brand {
    return {
      brand_id: r["record_id"] ?? `business_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      name: r["Business Name"] ?? "",
      type: "local_shop",
      area: r["Location/Borough"] ?? "",
      sectors: toList(r["Business Type"]),
      partnership_interests: toList(r["Potential Offering"]),
      website: "",
      consent_contact: true,
      contact: r["Contact Details"] || null,
      image_url: r["Image URL"] || null,
    };
  }

  // ============================================================
  // Influencer — INFLUENCERS, master sheet
  // ============================================================

  async getInfluencers(): Promise<Influencer[]> {
    const rows = rowsToObjects(await readTab("master", "INFLUENCERS"));
    return rows.map((r, i) => ({
      influencer_id: r["record_id"] ?? `inf_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      name: r["Name / Handle"] ?? "",
      area: r["Location"] ?? "",
      platforms: toList(r["Platform(s)"]),
      follower_band: r["Follower Count"] ?? "",
      niches: toList(r["Niche / Category"]),
      direct_contact_url: r["Contact Method"] ?? "",
      consent_contact: true, // always contactable — Kennedy's decision, 20 Aug
      image_url: r["Image URL"] || null,
    }));
  }

  // ============================================================
  // ClubDirectoryEntry — CLUBS (O), master sheet
  // ============================================================

  async getClubsDirectory(): Promise<ClubDirectoryEntry[]> {
    // Real source: "Club Hub" sheet, "Dynamic Club Page Hub" tab (Kennedy,
    // 20 Aug) — replaces the seed-data fallback that was previously here.
    // Column mapping traced against the real headers: club_id, club_name,
    // location, activity_type, image_url, page_url, audience, date_added.
    // "active" (yes/no) filters out inactive rows entirely, not just
    // shown-but-flagged, since an inactive club shouldn't be a live
    // outreach target at all.
    const rows = rowsToObjects(await readTab("club_hub", "Dynamic Club Page Hub"));
    return rows
      .filter((r) => r["active"]?.toLowerCase() !== "no")
      .map((r, i) => ({
        directory_id: r["club_id"] ?? `clubhub_${i}`,
        created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
        sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
        name: r["club_name"] ?? "",
        sport: r["activity_type"] ?? "",
        area: r["location"] ?? "",
        open_to: toList(r["audience"]),
        public_contact_url: r["page_url"] ?? r["booking_url"] ?? r["Website"] ?? "",
        image_url: r["image_url"] || r["club_logo_emoji"] || null,
      }));
  }

  // ============================================================
  // Sponsorship — SPONSORSHIPS + FUNDING, master sheet
  // ============================================================

  async getSponsorships(): Promise<Sponsorship[]> {
    const [sponsorRows, fundingRows] = await Promise.all([
      readTab("master", "SPONSORSHIPS"),
      readTab("master", "FUNDING"),
    ]);
    const sponsorships = rowsToObjects(sponsorRows).map((r, i) => this.rowToSponsorship(r, i));
    const funding = rowsToObjects(fundingRows).map((r, i) => this.rowToSponsorshipFromFunding(r, i));
    return [...sponsorships, ...funding];
  }

  private rowToSponsorship(r: Record<string, string | undefined>, i: number): Sponsorship {
    return {
      opportunity_id: r["record_id"] ?? `sp_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      title: r["Opportunity Name"] ?? "",
      provider: r["Offering Club/Entity"] ?? "",
      amount: r["Package Value"] ?? "",
      closing_date: r["Expiry Date"] ?? "",
      eligibility_tags: [],
      sports: toList(r["Sport"]),
      areas: toList(r["Location"]),
      apply_url: "", // no direct apply-URL column on SPONSORSHIPS — Contact holds a contact route instead
      description: [r["Sponsorship Type"], r["Inventory Type"]].filter(Boolean).join(" — "),
      image_url: r["Image URL"] || null,
    };
  }

  private rowToSponsorshipFromFunding(r: Record<string, string | undefined>, i: number): Sponsorship {
    return {
      opportunity_id: r["record_id"] ?? `fund_${i}`,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      sponsored: r["PREMIUM/CORE"]?.toLowerCase() === "premium",
      title: r["Fund/Grant Name"] ?? "",
      provider: r["Funding Body"] ?? "",
      amount: r["Amount Range"] ?? "",
      closing_date: r["Application Deadline"] ?? "",
      eligibility_tags: toList(r["Eligibility Criteria"]),
      sports: toList(r["Sport/Sector Restriction"]),
      areas: toList(r["Geographic Restriction"]),
      apply_url: r["Link/Application URL"] ?? "",
      description: r["Funding Type"] ?? "",
      image_url: r["Image URL"] || null,
    };
  }

  // ============================================================
  // Opportunity — OPPORTUNITIES, master sheet
  // ============================================================

  async getOpportunities(): Promise<Opportunity[]> {
    const rows = rowsToObjects(await readTab("master", "OPPORTUNITIES"));
    return rows.map((r, i) => ({
      opportunity_id: r["Opportunity ID"] ?? `opp_${i}`,
      title: r["Title"] ?? "",
      type: (r["Type"]?.toLowerCase() as Opportunity["type"]) ?? "resource",
      date: r["Date Added"] ?? new Date().toISOString().slice(0, 10),
      area: r["Location (Borough)"] ?? "",
      tags: toList(r["Sport(s)"]),
      link: r["Application Link / URL"] ?? "",
      description: r["Description"] ?? "",
      submitted_by_club_id: null,
      status: (r["Status"]?.toLowerCase() === "closed" ? "closed" : "open"),
    }));
  }

  // ============================================================
  // CHOS Workspace — TRENDING TOPICS, RESOURCES, FAQs, PERKS,
  // CALENDAR, SERVICES
  // ============================================================

  async getTrendingTopics(): Promise<TrendingTopic[]> {
    const rows = rowsToObjects(await readTab("workspace", "TRENDING TOPICS"));
    const topics: TrendingTopic[] = rows.map((r, i) => {
      const buzz = toNumber(r["Buzzscore"], 50); // single combined score — Kennedy's decision, 20 Aug: use directly, don't split into two
      return {
        topic_id: r["Entry ID"] ?? `trend_${i}`,
        headline: r["Title"] ?? "",
        source: "", // no explicit source column distinct from Type
        category: "grassroots", // no direct category source on this tab — Type maps to source_type below instead
        source_type: (r["Source Type"]?.toLowerCase() as TrendingTopic["source_type"]) ?? "news",
        summary: r["Description"] ?? "",
        why_it_matters: r["Why it matters"] ?? "",
        url: r["URL"] ?? "",
        published_at: new Date().toISOString().slice(0, 10), // no date column on this tab
        trending_score: buzz,
        interest_score: buzz,
        content_angle: { title: "", medium: "" }, // no longer displayed (removed 19 Aug); kept only so the type is satisfied
        thumbnail_url: r["Image URL"] ?? "",
      };
    });
    return topics.sort((a, b) => b.published_at.localeCompare(a.published_at));
  }

  async getResources(): Promise<Resource[]> {
    const rows = rowsToObjects(await readTab("workspace", "RESOURCES"));
    return rows.map((r, i) => ({
      resource_id: r["Entry ID"] ?? `res_${i}`,
      title: r["Title"] ?? "",
      category: (r["Category"]?.toLowerCase() as Resource["category"]) ?? "strategy",
      format: (r["Format"]?.toLowerCase() as Resource["format"]) ?? "article",
      url: r["URL"] ?? "",
      summary: r["Summary"] ?? "",
      created_at: new Date().toISOString().slice(0, 10), // no date column on this tab
    }));
  }

  async getFaq(): Promise<Faq[]> {
    const rows = rowsToObjects(await readTab("workspace", "FAQs"));
    return rows.map((r, i) => ({
      faq_id: r["FAQ Entry"] ?? `faq_${i}`,
      question: r["Question"] ?? "",
      answer: r["Answer"] ?? "",
      category: "general", // no category column
      order: i, // no order column — sheet row order is the order
    }));
  }

  async getPerks(): Promise<Perk[]> {
    const rows = rowsToObjects(await readTab("workspace", "PERKS"));
    return rows.map((r, i) => ({
      perk_id: r["Perk Entry"] ?? `perk_${i}`,
      partner: r["Perk Owner"] ?? "",
      title: r["Title"] ?? "",
      category: (r["Perk Type"]?.toLowerCase() as Perk["category"]) ?? "equipment",
      description: r["Description"] ?? "",
      offer: r["Perk Offer"] ?? "",
      redeem_code: r["Perk Code"] || null,
      redeem_url: r["Perk URL"] ?? "",
      plan_tiers: ["core", "premium"], // no plan-tier column — every perk visible to all plans, Kennedy's decision 20 Aug
      active: true, // no active column
      created_at: new Date().toISOString().slice(0, 10),
    }));
  }

  async getEvents(): Promise<Event[]> {
    const rows = rowsToObjects(await readTab("workspace", "CALENDAR"));
    return rows.map((r, i) => ({
      event_id: r["Entry ID"] ?? `evt_${i}`,
      title: r["Title"] ?? "",
      date: combineCalendarDate(r["Day"], r["Month"], r["Year"], r["Time"]),
      end_date: null,
      area: r["Location"] ?? "",
      type: r["Type"] ?? "",
      link: r["URL"] ?? "",
      notes: [r["Description"], r["Event Owner"] ? `Owner: ${r["Event Owner"]}` : null]
        .filter(Boolean)
        .join(" — "),
    }));
  }

  async getServices(): Promise<Service[]> {
    const rows = rowsToObjects(await readTab("workspace", "SERVICES"));
    return rows.map((r, i) => {
      const rate = toNumber(r["Price Per Hour"], 0);
      const discountRaw = r["Discount if on Premium Plan"];
      let premiumRate: number | null = null;
      if (discountRaw) {
        // Column may hold either a discounted absolute rate ("£38") or a
        // percentage-off ("15%") — handle both rather than assuming one.
        if (discountRaw.includes("%")) {
          const pct = toNumber(discountRaw, 0);
          premiumRate = Math.round(rate * (1 - pct / 100));
        } else {
          const abs = toNumberOrNull(discountRaw);
          if (abs != null && abs < rate) premiumRate = abs;
        }
      }
      return {
        service_id: r["Service ID"] ?? `svc_${i}`,
        name: r["Title"] ?? "",
        category: "ad_hoc", // no category column on SERVICES — Offer #1-5 hold free-text detail instead
        description: r["Description"] ?? "",
        hourly_rate_gbp: rate,
        active: true, // no active column
        created_at: new Date().toISOString().slice(0, 10),
        premium_hourly_rate_gbp: premiumRate,
      };
    });
  }
}
