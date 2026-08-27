import type {
  ActionLogRow,
  Brand,
  Club,
  ClubDirectoryEntry,
  Event,
  Faq,
  InboxMessage,
  Influencer,
  Opportunity,
  Perk,
  NbrhUpdate,
  Person,
  PlanDetails,
  PlanTier,
  Player,
  Resource,
  Service,
  Sponsorship,
  SocialVenue,
  Supplier,
  TokenRef,
  TrendingTopic,
} from "../types";
import type { DataAdapter, SubmitActionInput, SubmitActionResult } from "./index";
import { LocalAdapter } from "./index";
import { PostgresAdapter } from "./postgres";
import { readTab, rowsToObjects, getLatestFetchAt } from "./sheets/client";
import type { SheetSource } from "./sheets/client";
import { toBool, toList, toNumberOrNull, toNumber, combineKpiPairs, combineCalendarDate, readSponsored } from "./sheets/parse";

/**
 * Wraps readTab for tabs that may genuinely not exist yet on the real
 * spreadsheet (KIT, INBOX — both added 27 Aug). readTab throws on a
 * failed Sheets API call with no cached fallback to serve instead, which
 * is correct for an established tab (a transient failure should surface,
 * per architecture.md § Failure), but wrong for a tab that has never
 * existed at all — that's not a transient failure, it's an expected gap
 * until Kennedy creates the sheet, and every OTHER page on the site
 * shouldn't crash because one new tab isn't there yet (this was a real
 * production incident, 27 Aug: the header's unread-count check ran on
 * every page via the shared layout, so a missing INBOX tab took down the
 * whole site, not just the Inbox page). Degrades to an empty result —
 * callers already handle an empty list with their normal empty state.
 */
async function readTabSafe(source: SheetSource, tabName: string): Promise<string[][]> {
  try {
    return await readTab(source, tabName);
  } catch {
    return [];
  }
}

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
/**
 * Maps DASHBOARD (X) column H's real text ("Free"/"Core"/"Core+"/"Premium"/
 * "Premium+", case-insensitive) to the internal PlanTier key. Shared logic
 * with getPlans()'s PLAN-column mapping below — same label set, two
 * different sheets. Falls back to "free" (not "core") on an unrecognised
 * value, since defaulting a genuinely blank/bad cell to a PAID tier would
 * silently grant paywalled access — the safer failure direction here is
 * under-granting, not over-granting.
 */
function mapSubscriptionTier(raw: string | undefined): PlanTier {
  const label = raw?.trim().toLowerCase() ?? "";
  const map: Record<string, PlanTier> = {
    free: "free",
    core: "core",
    "core+": "core_plus",
    premium: "premium",
    "premium+": "premium_plus",
  };
  return map[label] ?? "free";
}

export class SheetsAdapter implements DataAdapter {
  private local = new LocalAdapter();
  private ledger = new PostgresAdapter();

  // --- ledger, delegated to Postgres (see file header) ---
  getActionsForClub = this.ledger.getActionsForClub.bind(this.ledger);
  /**
   * NOT a plain bind (unlike the other ledger methods) — this needs the
   * club's REAL plan_tier and the REAL PlanDetails.tokens value, both of
   * which only this class (not PostgresAdapter's own `this.local`) has
   * correct access to. Looks the club up by club_id (Actions_Log rows only
   * carry club_id, not the full Club), finds its plan's token allocation,
   * and passes that to the ledger as allocationOverride so the balance
   * math still runs where the ledger actually lives.
   */
  async getTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }> {
    const [clubs, plans] = await Promise.all([this.getAllClubs(), this.getPlans()]);
    const club = clubs.find((c) => c.club_id === club_id);
    const plan = club ? plans.find((p) => p.tier === club.plan_tier) : undefined;
    return this.ledger.getTokenBalance(club_id, plan?.tokens);
  }
  submitAction = (input: SubmitActionInput): Promise<SubmitActionResult> => this.ledger.submitAction(input);
  getAllActions = this.ledger.getAllActions.bind(this.ledger);
  /**
   * Same reasoning as getTokenBalance above — needs the real plan
   * allocation, which PostgresAdapter's own Config-based fallback can't
   * provide correctly for a Sheets-backed club.
   */
  async resetTokenBalance(club_id: string): Promise<{ balance: number; allocation: number }> {
    const [clubs, plans] = await Promise.all([this.getAllClubs(), this.getPlans()]);
    const club = clubs.find((c) => c.club_id === club_id);
    const plan = club ? plans.find((p) => p.tier === club.plan_tier) : undefined;
    return this.ledger.resetTokenBalance(club_id, plan?.tokens);
  }
  setActionStatus = this.ledger.setActionStatus.bind(this.ledger);
  clearAllActions = this.ledger.clearAllActions.bind(this.ledger);

  /**
   * Inbox (Kennedy's request, 27 Aug) — content read from the real INBOX
   * tab (CHOS Workspace sheet), club_id column routes each row to the
   * right club (Kennedy's own words: each message is "tagged with the
   * club that it's meant for"). Read/unread state is delegated to
   * this.ledger (Postgres) rather than this.local — same split
   * PostgresAdapter's own getInboxMessages() makes, and for the same
   * reason: read state changes per-click and per-club, which a
   * hand-edited content sheet is a poor fit for (see InboxReadState's
   * doc comment in lib/types.ts).
   */
  async getInboxMessages(club_id: string): Promise<(InboxMessage & { read: boolean })[]> {
    const rows = rowsToObjects(await readTabSafe("workspace", "INBOX"));
    const messages: InboxMessage[] = rows
      .filter((r) => r["club_id"] === club_id)
      .map((r, i) => ({
        message_id: r["message_id"] ?? `inbox_${i}`,
        club_id: r["club_id"] ?? club_id,
        sent_at: r["Date"] ?? new Date().toISOString(),
        subject: r["Subject"] ?? "",
        body: r["Body"] ?? "",
        link: r["URL"] || null,
      }))
      .sort((a, b) => a.sent_at.localeCompare(b.sent_at)); // chronological, per Kennedy's request

    // Read state comes from the ledger, not from mapping this.local's own
    // (differently-sourced) read flags — see doc comment above.
    const readIds = await this.ledger.getInboxReadIds(club_id);
    return messages.map((m) => ({ ...m, read: readIds.has(m.message_id) }));
  }
  getUnreadInboxCount = async (club_id: string): Promise<number> => {
    const all = await this.getInboxMessages(club_id);
    return all.filter((m) => !m.read).length;
  };
  markInboxMessageRead = this.ledger.markInboxMessageRead.bind(this.ledger);

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
      plan_tier: mapSubscriptionTier(r["Subscription Tier"]),
      goals: r["Goals"] ?? "",
      kpis: combineKpiPairs(r),
      members_count: toNumberOrNull(r["Members"]),
      teams_count: toNumberOrNull(r["Teams"]),
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
    //
    // Expanded fields (Kennedy, 25 Aug): club_bio, monthly_fee_text,
    // email, instagram, Website, Address, Verified?, Total Teams,
    // gallery_image_urls_1-4 — real columns confirmed present on the
    // sheet but previously unused, now surfaced in the expanded detail
    // panel.
    const rows = rowsToObjects(await readTab("club_hub", "Dynamic Club Page Hub"));
    return rows
      .filter((r) => r["active"]?.toLowerCase() !== "no")
      .map((r, i) => ({
        directory_id: r["club_id"] ?? `clubhub_${i}`,
        created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
        sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
        name: r["club_name"] ?? "",
        sport: r["activity_type"] ?? "",
        area: r["location"] ?? "",
        open_to: toList(r["audience"]),
        public_contact_url: r["page_url"] ?? r["booking_url"] ?? r["Website"] ?? "",
        image_url: r["image_url"] || r["club_logo_emoji"] || null,
        bio: r["club_bio"] || null,
        fee_text: r["monthly_fee_text"] || null,
        email: r["email"] || null,
        instagram_url: r["instagram"] || null,
        website_url: r["Website"] || null,
        address: r["Address"] || null,
        verified: toBool(r["Verified?"]),
        total_teams: toNumberOrNull(r["Total Teams"]),
        gallery_image_urls: [
          r["gallery_image_urls_1"],
          r["gallery_image_urls_2"],
          r["gallery_image_urls_3"],
          r["gallery_image_urls_4"],
        ].filter((url): url is string => Boolean(url)),
      }));
  }

  // ============================================================
  // Supplier — KIT, master sheet (Kennedy's request, 27 Aug)
  // ============================================================

  async getSuppliers(): Promise<Supplier[]> {
    const rows = rowsToObjects(await readTabSafe("master", "KIT"));
    return rows.map((r, i) => ({
      supplier_id: r["Entity ID"] ?? r["record_id"] ?? `kit_${i}`,
      record_id: r["record_id"] ?? `kit_${i}`,
      name: r["Supplier Name"] ?? "",
      product_categories: toList(r["Product Categories"]),
      brands_carried: toList(r["Brands Carried"]),
      price_tier: r["Price Tier"] ?? "",
      bulk_discount: r["Bulk/Team Discount"] || null,
      customization_offered: r["Customization Offered"] || null,
      sustainability_credentials: r["Sustainability Credentials"] || null,
      safeguarding_compliance: r["Safeguarding Compliance"] || null,
      sample_available: toBool(r["Sample Available"]),
      lead_time: r["Lead Time"] || null,
      minimum_order: r["Minimum Order"] || null,
      delivery_area: r["Delivery Area"] ?? "",
      contact: r["Contact"] || null,
      past_grassroots_clients: r["Past Grassroots Clients"] || null,
      image_url: r["Image URL"] || null,
      created_at: r["date_added"] ?? new Date().toISOString().slice(0, 10),
      last_updated: r["last_updated"] || null,
      added_by: r["added_by"] || null,
      source_url: r["source_url"] || null,
      credibility_score: toNumberOrNull(r["credibility_score"]),
      verification_status: r["verification_status"] || null,
      tags: toList(r["tags"]),
      // "U notes" — Kennedy's own private notes, never rendered club-facing.
      internal_notes: r["U notes"] || null,
      // "PREMIUM/CORE" — whole subsection is locked on Free regardless (see
      // the Outreach layout's LOCKED_SLUGS), so this field is read but not
      // currently branched on per-row; kept for a future per-supplier gate
      // if Kennedy ever wants some suppliers visible on Free.
      plan_gated: toBool(r["PREMIUM/CORE"]),
      sponsored: readSponsored(r),
    }));
  }

  // ============================================================
  // SocialVenue — placeholder, no real "SOCIAL VENUES" worksheet yet
  // ============================================================

  /**
   * No real tab exists — Kennedy's own words (27 Aug): "I haven't created
   * the worksheet yet, but it will be called 'SOCIAL VENUES'". Delegates
   * to LocalAdapter's seed data rather than attempting a readTab() call
   * against a sheet that doesn't exist, same pattern this file used for
   * Brands/Influencers before their own reconciliation.
   */
  getSocialVenues = (): Promise<SocialVenue[]> => this.local.getSocialVenues();

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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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
      sponsored: readSponsored(r), // Kennedy, 25 Aug: real SPONSORED/SPONSORED? column, not PREMIUM/CORE
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

  async getNbrhUpdates(): Promise<NbrhUpdate[]> {
    // "FROM THE NBRH" tab, CHOS Workspace — real columns Date, Note (col B),
    // URL (col C, may be blank). This was never actually wired up before
    // (Kennedy's report, 25 Aug: the note "isn't connecting to the sheet" —
    // true, community_note on Club was hardcoded to an empty string and
    // this method didn't exist at all). Skips rows with no Note text
    // rather than showing an empty feed entry.
    const rows = rowsToObjects(await readTab("workspace", "FROM THE NBRH"));
    return rows
      .filter((r) => r["Note"])
      .map((r, i) => ({
        update_id: `nbrh_${i}`,
        date: r["Date"] ?? new Date().toISOString().slice(0, 10),
        note: r["Note"] ?? "",
        url: r["URL"] || null,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
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
      plan_tiers: ["free", "core", "core_plus", "premium", "premium_plus"], // no plan-tier column — every perk visible to all plans, Kennedy's decision 20 Aug (extended to all 5 tiers, 25 Aug)
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

  async getPlans(): Promise<PlanDetails[]> {
    // PLAN sheet's real columns: PLAN, PRICE/MO, PERK 1-11, TOKENS (column
    // N, added 25 Aug per Kennedy). PLAN holds the tier as display text —
    // mapSubscriptionTier() above does the same label→PlanTier mapping
    // DASHBOARD (X)'s column H needs, reused here rather than duplicated.
    const rows = rowsToObjects(await readTab("workspace", "PLAN"));
    const seen = new Set<PlanTier>();
    return rows
      .map((r) => {
        const tier = mapSubscriptionTier(r["PLAN"]);
        if (seen.has(tier)) return null; // guards against an unrecognised PLAN value defaulting to "free" twice
        seen.add(tier);
        const perks: string[] = [];
        for (let i = 1; i <= 11; i++) {
          const perk = r[`PERK ${i}`];
          if (perk) perks.push(perk);
        }
        return {
          tier,
          price: r["PRICE/MO"] ?? "",
          perks,
          tokens: toNumber(r["TOKENS"], 0),
        };
      })
      .filter((p): p is PlanDetails => p !== null);
  }
}
