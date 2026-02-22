import { createClient } from "./supabase/browser";
import type { RdnNewUpdateRecord, UpdateSourceType } from "./types";

/* ── Shared Types ──────────────────────────────────────────── */

export interface DailyUpdate {
  day: string;       // ISO date string e.g. "2026-02-05"
  dayLabel: string;  // e.g. "Wed 2/5"
  count: number;
}

export interface SourceCount {
  source: UpdateSourceType;
  count: number;
}

export interface DaySummary {
  total: number;
  handled: number;
  needAction: number;
  autoPercent: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  handledCount: number;
}

/* ── Helpers ───────────────────────────────────────────────── */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]} ${month}/${day}`;
}

// Handled status — will be defined per-category once CEO specifies which are auto-handled
function isHandled(_updateId: number): boolean {
  return false;
}

function getRouteLabel(_updateId: number): string {
  return "";
}

// Client-side content categorizer when content_category is NULL
function categorizeContent(update: RdnNewUpdateRecord): string {
  const text = (update.update_content || "").toLowerCase();
  const type = update.update_type || "";

  if (type === "Client") {
    if (text.includes("close") || text.includes("cancel")) return "close-request";
    if (text.includes("reopen")) return "reopen-request";
    if (text.includes("hold")) return "hold-request";
    if (text.includes("new assignment") || text.includes("new case") || text.includes("placed")) return "new-placement";
    if (text.includes("fee") || text.includes("invoice") || text.includes("billing") || text.includes("bonus")) return "fees-billing";
    if (text.includes("address") || text.includes("location")) return "address-update";
    if (text.includes("comply") || text.includes("compliance") || text.includes("title") || text.includes("paperwork")) return "compliance";
    if (text.includes("request") || text.includes("info") || text.includes("need")) return "info-request";
    if (text.includes("instruct") || text.includes("update")) return "new-instructions";
    return "other";
  }
  if (type === "System") {
    if (text.includes("drn") || text.includes("hit")) return "drn-hit";
    if (text.includes("storage")) return "storage-update";
    if (text.includes("recovery") || text.includes("datetime")) return "recovery-datetime";
    if (text.includes("admin") || text.includes("system")) return "admin-action";
    return "other";
  }
  if (type === "Check-In") {
    if (text.includes("no change") || text.includes("occupied") || text.includes("no unit")) return "occupied-no-unit";
    if (text.includes("inaccessible") || text.includes("gated") || text.includes("locked")) return "collateral-inaccessible";
    if (text.includes("lpr") || text.includes("scan")) return "lpr-scan";
    if (text.includes("contact") || text.includes("spoke") || text.includes("debtor")) return "debtor-contact";
    if (text.includes("vacant") || text.includes("empty")) return "vacant-address";
    return "other";
  }
  if (type === "Agent") {
    if (text.includes("added address") || text.includes("address added")) return "address-added";
    if (text.includes("observ") || text.includes("field")) return "field-observation";
    if (text.includes("no change")) return "field-observation";
    if (text.includes("voluntary") || text.includes("surrender")) return "voluntary-surrender";
    if (text.includes("location") || text.includes("intel")) return "location-intel";
    return "other";
  }
  if (type === "Agent C/R" || type === "Agent Recovery") {
    if (text.includes("on hook") || text.includes("on-hook") || text.includes("hooked")) return "on-hook";
    if (text.includes("repo") || text.includes("recovered") || text.includes("secured")) return "repossessed";
    return "other";
  }
  if (type === "Discount") {
    if (text.includes("approve")) return "approved";
    if (text.includes("request")) return "requested";
    if (text.includes("deny") || text.includes("denied") || text.includes("reject")) return "denied";
    return "other";
  }
  return "other";
}

/* ── Enrich raw records with derived fields ────────────────── */

export interface EnrichedUpdate extends RdnNewUpdateRecord {
  derivedCategory: string;
  handled: boolean;
  routeLabel: string;
}

function enrichUpdate(record: RdnNewUpdateRecord): EnrichedUpdate {
  const uid = record.update_id ?? 0;
  const derivedCategory = record.content_category || categorizeContent(record);

  // Promote DRN Hit from a System subcategory to its own top-level source
  const isDrnHit = derivedCategory === "drn-hit";
  // Merge all agent-related sources into Agent
  const AGENT_TYPES = ["Agent", "Check-In", "Discount", "Agent C/R", "Agent Recovery"];
  const isAgentGroup = AGENT_TYPES.includes(record.update_type || "");
  const updateType = isDrnHit ? "DRN Hit" : isAgentGroup ? "Agent" : record.update_type;
  const category = isDrnHit ? classifyDrnHit(record) : derivedCategory;

  return {
    ...record,
    update_type: updateType,
    derivedCategory: category,
    handled: isHandled(uid),
    routeLabel: isHandled(uid) ? getRouteLabel(uid) : "",
  };
}

/** Sub-categorize DRN Hit records */
function classifyDrnHit(record: RdnNewUpdateRecord): string {
  const text = (record.update_content || "").toLowerCase();
  if (text.includes("purchased")) return "hit-purchased";
  if (text.includes("new drn hit") || text.includes("has been added")) return "new-hit-location";
  return "other";
}

/* ── Queries ───────────────────────────────────────────────── */

export async function fetchDailyUpdates(): Promise<DailyUpdate[]> {
  const supabase = createClient();
  const allData: { update_date: string }[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from("rdn_new_updates")
      .select("update_date")
      .order("update_date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to fetch updates: ${error.message}`);
    if (!page || page.length === 0) break;

    allData.push(...page);

    const distinctDates = new Set(allData.map(r => r.update_date?.substring(0, 10)).filter(Boolean));
    if (distinctDates.size >= 10) break;

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (allData.length === 0) return [];

  const countsByDate = new Map<string, number>();
  for (const row of allData) {
    if (!row.update_date) continue;
    const dateKey = row.update_date.substring(0, 10);
    countsByDate.set(dateKey, (countsByDate.get(dateKey) || 0) + 1);
  }

  const sortedDates = [...countsByDate.keys()].sort().reverse().slice(0, 7).reverse();

  return sortedDates.map((day) => ({
    day,
    dayLabel: formatDayLabel(day),
    count: countsByDate.get(day) || 0,
  }));
}

export async function fetchUpdatesByDay(day: string): Promise<EnrichedUpdate[]> {
  const supabase = createClient();
  const allRecords: RdnNewUpdateRecord[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  // Fetch all updates for this day across all pages
  while (true) {
    const { data: page, error } = await supabase
      .from("rdn_new_updates")
      .select("*")
      .gte("update_date", `${day} 00:00:00`)
      .lt("update_date", `${day}T23:59:59.999`)
      .order("update_date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to fetch day updates: ${error.message}`);
    if (!page || page.length === 0) break;

    allRecords.push(...(page as RdnNewUpdateRecord[]));

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRecords.map(enrichUpdate);
}

// Derive all aggregate data from a pre-fetched enriched dataset
export function computeSourceCounts(updates: EnrichedUpdate[]): SourceCount[] {
  const counts = new Map<string, number>();
  for (const u of updates) {
    const src = u.update_type || "Unknown";
    counts.set(src, (counts.get(src) || 0) + 1);
  }

  // All known sources — include even if zero count
  const ALL_SOURCES: UpdateSourceType[] = ["Client", "DRN Hit", "Agent", "System"];
  const seen = new Set<string>();
  const result: SourceCount[] = [];
  for (const source of ALL_SOURCES) {
    result.push({ source, count: counts.get(source) || 0 });
    seen.add(source);
  }
  // Add any unexpected sources
  for (const [src, count] of counts) {
    if (!seen.has(src)) {
      result.push({ source: src as UpdateSourceType, count });
    }
  }
  // Fixed sort order: Client → DRN Hit → Agent → System
  const priority: Record<string, number> = { Client: 0, "DRN Hit": 1, Agent: 2, System: 3 };
  return result.sort((a, b) => {
    const pa = priority[a.source] ?? 99;
    const pb = priority[b.source] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.source.localeCompare(b.source);
  });
}

export function computeDaySummary(updates: EnrichedUpdate[]): DaySummary {
  const total = updates.length;
  const handled = updates.filter(u => u.handled).length;
  const needAction = total - handled;
  const autoCount = updates.filter(u => u.handled && u.routeLabel === "auto").length;
  const autoPercent = total > 0 ? Math.round((autoCount / total) * 100) : 0;
  return { total, handled, needAction, autoPercent };
}

export function computeCategoryCounts(updates: EnrichedUpdate[], source: string): CategoryCount[] {
  const map = new Map<string, { count: number; handledCount: number }>();
  for (const u of updates) {
    if (u.update_type !== source) continue;
    const cat = u.derivedCategory;
    const existing = map.get(cat) || { count: 0, handledCount: 0 };
    existing.count++;
    if (u.handled) existing.handledCount++;
    map.set(cat, existing);
  }

  return [...map.entries()]
    .map(([category, { count, handledCount }]) => ({ category, count, handledCount }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function getUpdatesForSourceCategory(
  updates: EnrichedUpdate[],
  source: string,
  category?: string
): EnrichedUpdate[] {
  let filtered = updates.filter(u => u.update_type === source);
  if (category) {
    filtered = filtered.filter(u => u.derivedCategory === category);
  }
  // Sort by time desc
  return filtered.sort((a, b) => {
    const timeA = new Date(a.update_date || 0).getTime();
    const timeB = new Date(b.update_date || 0).getTime();
    return timeB - timeA;
  });
}
