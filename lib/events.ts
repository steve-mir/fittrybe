import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SportId =
  | "football"
  | "basketball"
  | "cycling"
  | "running"
  | "badminton"
  | "tennis"
  | "gym"
  | string;

export interface FittrybeEvent {
  id: string;
  title: string;
  sportId: SportId;
  locationArea: string;
  locationLabel: string;
  placeName: string;
  placeVicinity: string;
  placeLat: string;
  placeLng: string;
  placeRating: string | null;
  placePhotoUrl: string | null;
  bannerUrl: string | null;
  startsAt: string;
  status: "upcoming" | "active" | "cancelled" | "completed" | string;
  isCancelled: boolean;
  cancellationReason: string | null;
  spotsLeft: number;
  joinPricePence: number;
  paymentMethod: string;
  isRecurring: boolean;
  parentSessionId: string | null;
  participantsCount: number;
  viewsCount: number;
  isFeatured: boolean;
  hostId: string;
  createdAt: string;
  updatedAt: string | null;
  description: string | null;
}

/**
 * Sport-specific detail rows hold duration, capacity, etc. We don't always
 * need them, but when we do (event detail page, JSON-LD endDate calc) we
 * fetch them in a second query keyed by sport_id.
 */
export interface EventDetailExtras {
  durationMinutes: number | null;
  capacity: number | null;
  hostName: string | null;
  hostUsername: string | null;
  hostAvatar: string | null;
  reviewSummary: { ratingValue: number; reviewCount: number } | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvent(row: any): FittrybeEvent {
  return {
    id: row.id,
    title: row.title,
    sportId: row.sport_id,
    locationArea: row.location_area ?? "",
    locationLabel: row.location_label ?? "",
    placeName: row.place_name ?? "",
    placeVicinity: row.place_vicinity ?? "",
    placeLat: row.place_lat ?? "",
    placeLng: row.place_lng ?? "",
    placeRating: row.place_rating ?? null,
    placePhotoUrl: row.place_photo_url ?? null,
    bannerUrl: row.banner_url ?? null,
    startsAt: row.starts_at,
    status: row.status ?? "upcoming",
    isCancelled: row.is_cancelled ?? false,
    cancellationReason: row.cancellation_reason ?? null,
    spotsLeft: row.spots_left ?? 0,
    joinPricePence: row.join_price_pence ?? 0,
    paymentMethod: row.payment_method ?? "cash",
    isRecurring: row.is_recurring ?? false,
    parentSessionId: row.parent_session_id ?? null,
    participantsCount: row.participants_count ?? 0,
    viewsCount: row.views_count ?? 0,
    isFeatured: row.is_featured ?? false,
    hostId: row.host_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    description: row.description ?? null,
  };
}

// ─── Public reads ─────────────────────────────────────────────────────────────

/** Fetch upcoming (non-cancelled) events ordered by starts_at ascending. */
export async function getUpcomingEvents(): Promise<FittrybeEvent[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error || !data) return [];
  return data.map(rowToEvent);
}

/** Fetch a single event by ID. Returns null if not found or cancelled. */
export async function getEventById(id: string): Promise<FittrybeEvent | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToEvent(data);
}

/** Fetch all events for generateStaticParams (including past, for SSG). */
export async function getAllEventIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("is_cancelled", false);

  if (error || !data) return [];
  return data.map((row) => row.id);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  cycling: "🚴",
  running: "🏃",
  badminton: "🏸",
  tennis: "🎾",
  gym: "🏋️",
  cricket: "🏏",
  rugby: "🏉",
  swimming: "🏊",
};

export function sportEmoji(sportId: string): string {
  return SPORT_EMOJI[sportId.toLowerCase()] ?? "🏅";
}

export function formatEventDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatEventTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(pence: number): string {
  if (pence === 0) return "Free";
  return `£${(pence / 100).toFixed(2)}`;
}

// ─── SEO helpers ─────────────────────────────────────────────────────────────

/** Convert a free-form area name (e.g. "Redhill, Surrey") into a URL slug. */
export function citySlug(area: string): string {
  return area
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Best-effort de-slug for display ("redhill-surrey" → "Redhill, Surrey"). */
export function citySlugToDisplay(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/**
 * Map sport_id values stored in `sessions` to their detail-table name.
 * `gym`, `running`, `cycling`, `football`, `basketball` use bespoke tables.
 * Anything else — tennis, badminton, squash, padel, etc. — lives in
 * `racket_details` keyed by `sport_type`.
 */
function detailTableForSport(sportId: string): string | null {
  switch (sportId) {
    case "football":
      return "football_details";
    case "basketball":
      return "basketball_details";
    case "running":
      return "running_details";
    case "cycling":
      return "cycling_details";
    case "gym":
      return "gym_details";
    case "tennis":
    case "badminton":
    case "squash":
    case "padel":
    case "pickleball":
    case "table_tennis":
      return "racket_details";
    default:
      return null;
  }
}

/**
 * Fetch a single event with all data needed for full SEO output —
 * sport-specific duration/capacity, host name, and review aggregate.
 */
export async function getEventWithExtras(
  id: string
): Promise<{ event: FittrybeEvent; extras: EventDetailExtras } | null> {
  const event = await getEventById(id);
  if (!event) return null;

  const extras: EventDetailExtras = {
    durationMinutes: null,
    capacity: null,
    hostName: null,
    hostUsername: null,
    hostAvatar: null,
    reviewSummary: null,
  };

  // Sport-specific details (duration + capacity)
  const detailTable = detailTableForSport(event.sportId);
  if (detailTable) {
    try {
      const { data } = await supabase
        .from(detailTable)
        .select("duration_minutes, capacity")
        .eq("session_id", id)
        .maybeSingle();
      if (data) {
        extras.durationMinutes = data.duration_minutes ?? null;
        extras.capacity = data.capacity ?? null;
      }
    } catch {
      // Table missing or RLS denied — fall back to defaults.
    }
  }

  // Host profile (for performer schema + display)
  if (event.hostId) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, display_name, username, avatar_url")
        .eq("id", event.hostId)
        .maybeSingle();
      if (data) {
        extras.hostName = data.display_name || data.full_name || data.username || null;
        extras.hostUsername = data.username ?? null;
        extras.hostAvatar = data.avatar_url ?? null;
      }
    } catch {
      // ignore
    }
  }

  // Review aggregate — pull both host_rating and session_rating for breadth
  try {
    const { data } = await supabase
      .from("session_reviews")
      .select("session_rating, host_rating")
      .eq("session_id", id);
    if (data && data.length > 0) {
      const ratings = data
        .map((r) => r.session_rating ?? r.host_rating)
        .filter((v): v is number => typeof v === "number" && v > 0);
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, n) => acc + n, 0);
        extras.reviewSummary = {
          ratingValue: sum / ratings.length,
          reviewCount: ratings.length,
        };
      }
    }
  } catch {
    // ignore
  }

  return { event, extras };
}

/**
 * Find related events for the "more sessions" block on event detail pages.
 * Same sport in same area first, fall back to same sport anywhere, then
 * any nearby session. Excludes the current event and cancelled events.
 */
export async function getRelatedEvents(
  event: FittrybeEvent,
  limit = 3
): Promise<FittrybeEvent[]> {
  const nowIso = new Date().toISOString();

  // 1. Same sport, same area
  const sameSportSameArea = await supabase
    .from("sessions")
    .select("*")
    .eq("is_cancelled", false)
    .eq("sport_id", event.sportId)
    .eq("location_area", event.locationArea)
    .neq("id", event.id)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(limit);

  let collected = sameSportSameArea.data?.map(rowToEvent) ?? [];

  if (collected.length < limit) {
    const remaining = limit - collected.length;
    const seen = new Set(collected.map((e) => e.id));
    const sameSportAnywhere = await supabase
      .from("sessions")
      .select("*")
      .eq("is_cancelled", false)
      .eq("sport_id", event.sportId)
      .neq("id", event.id)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(remaining + collected.length);
    const extra = (sameSportAnywhere.data ?? [])
      .map(rowToEvent)
      .filter((e) => !seen.has(e.id))
      .slice(0, remaining);
    collected = [...collected, ...extra];
  }

  if (collected.length < limit) {
    const remaining = limit - collected.length;
    const seen = new Set(collected.map((e) => e.id));
    const anyNearby = await supabase
      .from("sessions")
      .select("*")
      .eq("is_cancelled", false)
      .eq("location_area", event.locationArea)
      .neq("id", event.id)
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(remaining + collected.length);
    const extra = (anyNearby.data ?? [])
      .map(rowToEvent)
      .filter((e) => !seen.has(e.id))
      .slice(0, remaining);
    collected = [...collected, ...extra];
  }

  return collected;
}

/**
 * List distinct upcoming-event areas, with counts. Used by:
 *   • /events "Browse by city" block
 *   • sitemap.ts to enumerate /events/in/[city] pages
 *   • generateStaticParams for the city programmatic pages
 */
export async function getUpcomingEventCities(): Promise<
  Array<{ slug: string; name: string; count: number }>
> {
  const { data, error } = await supabase
    .from("sessions")
    .select("location_area")
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString())
    .not("location_area", "is", null);

  if (error || !data) return [];

  const counts = new Map<string, { name: string; count: number }>();
  for (const row of data) {
    const area = (row.location_area ?? "").trim();
    if (!area) continue;
    const slug = citySlug(area);
    if (!slug) continue;
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(slug, { name: area, count: 1 });
    }
  }

  return Array.from(counts.entries())
    .map(([slug, meta]) => ({ slug, ...meta }))
    .sort((a, b) => b.count - a.count);
}

/** Fetch upcoming events for a given city slug. */
export async function getUpcomingEventsByCitySlug(
  slug: string
): Promise<FittrybeEvent[]> {
  const all = await getUpcomingEvents();
  return all.filter((e) => citySlug(e.locationArea) === slug);
}

/** Fetch upcoming events for a given sport + city slug. */
export async function getUpcomingEventsBySportAndCitySlug(
  sportId: string,
  slug: string
): Promise<FittrybeEvent[]> {
  const all = await getUpcomingEvents();
  return all.filter(
    (e) => e.sportId === sportId && citySlug(e.locationArea) === slug
  );
}

/** Fetch upcoming events for a venue (matched by place_name + city). */
export async function getUpcomingEventsByVenue(
  venueName: string,
  city: string
): Promise<FittrybeEvent[]> {
  const all = await getUpcomingEvents();
  const venueKey = venueName.trim().toLowerCase();
  const cityKey = citySlug(city);
  return all.filter(
    (e) =>
      e.placeName.trim().toLowerCase() === venueKey &&
      citySlug(e.locationArea) === cityKey
  );
}

/** Convert a sport_id slug to a human-readable name. */
export function sportLabel(sportId: string): string {
  return sportId
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}