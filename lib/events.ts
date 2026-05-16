import { getServerReadClient } from "./supabase-server-read";

// Server-only Supabase client. Prefers service-role key so RLS on `sessions`
// (and detail tables) can't return empty arrays to anonymous SSR readers.
// Falls back to anon if service-role isn't configured (dev convenience).
const supabase = getServerReadClient();

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
  /**
   * Sport-specific rich detail. Populated whenever a per-sport detail row
   * exists. All fields are nullable / empty by default so the UI can render
   * each section behind a presence guard. Surfacing this content is the
   * single biggest SEO lever we have — Google rewards depth + uniqueness,
   * and these fields are uniquely written by each host.
   */
  rich: SessionRichDetails;
}

/**
 * Sport-agnostic rich detail shape — mapped from football_details,
 * basketball_details, cycling_details, running_details, gym_details and
 * racket_details into one consistent surface for the page renderer and
 * meta-description generator.
 */
export interface SessionRichDetails {
  // Common to most sports
  description: string | null;
  skillLevel: string | null;
  genderPreference: string | null;
  hostPlaying: boolean | null;
  womenOnly: boolean | null;
  whatToBring: string[];
  houseRules: string[];
  additionalNotes: string | null;
  meetingInstructions: string | null;
  parkingInfo: string | null;
  publicTransportInfo: string | null;
  amenities: {
    changingRooms: boolean;
    showers: boolean;
    parking: boolean;
    refreshments: boolean;
    waterFountain: boolean;
  };

  // Pitch / court / format
  gameFormat: string | null;
  matchType: string | null;
  pitchType: string | null;
  courtType: string | null;
  courtSurface: string | null;
  courtNumber: string | null;
  ballProvided: boolean | null;
  bibsProvided: boolean | null;
  equipmentProvided: boolean | null;

  // Endurance (cycling / running)
  distanceKm: number | null;
  routeType: string | null;
  terrainType: string | null;
  surfaceType: string | null;
  elevationGainM: number | null;
  paceType: string | null;
  rideIntensity: string | null;
  hasCoffeeStop: boolean | null;
  bikeType: string | null;
  noDropRide: boolean | null;
  startTitle: string | null;
  finishTitle: string | null;

  // Gym
  sessionType: string | null;
  focusArea: string | null;
  requiresMembership: boolean | null;
  meetingPointTitle: string | null;

  // Racket
  numberOfSets: number | null;
  gamesPerSet: number | null;
  scoringSystem: string | null;
  ownRacketRequired: boolean | null;
  coachPresent: boolean | null;
  coachName: string | null;
  warmUpMinutes: number | null;
  ballsProvided: boolean | null;
}

const EMPTY_RICH: SessionRichDetails = {
  description: null,
  skillLevel: null,
  genderPreference: null,
  hostPlaying: null,
  womenOnly: null,
  whatToBring: [],
  houseRules: [],
  additionalNotes: null,
  meetingInstructions: null,
  parkingInfo: null,
  publicTransportInfo: null,
  amenities: {
    changingRooms: false,
    showers: false,
    parking: false,
    refreshments: false,
    waterFountain: false,
  },
  gameFormat: null,
  matchType: null,
  pitchType: null,
  courtType: null,
  courtSurface: null,
  courtNumber: null,
  ballProvided: null,
  bibsProvided: null,
  equipmentProvided: null,
  distanceKm: null,
  routeType: null,
  terrainType: null,
  surfaceType: null,
  elevationGainM: null,
  paceType: null,
  rideIntensity: null,
  hasCoffeeStop: null,
  bikeType: null,
  noDropRide: null,
  startTitle: null,
  finishTitle: null,
  sessionType: null,
  focusArea: null,
  requiresMembership: null,
  meetingPointTitle: null,
  numberOfSets: null,
  gamesPerSet: null,
  scoringSystem: null,
  ownRacketRequired: null,
  coachPresent: null,
  coachName: null,
  warmUpMinutes: null,
  ballsProvided: null,
};

/**
 * Some columns are stored as text[] (Postgres array), others as jsonb arrays.
 * Normalise to a clean string[] so the renderer doesn't have to care.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
      .filter(Boolean);
  }
  // Some hosts seed jsonb with stringified JSON; tolerate it gracefully.
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? normaliseStringArray(parsed) : [];
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

/**
 * Translate sport detail-table column conventions ("five_a_side", "all_levels")
 * into human-readable strings safe to render and feed into meta descriptions.
 */
function humanise(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((p) => (p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
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
    rich: { ...EMPTY_RICH, amenities: { ...EMPTY_RICH.amenities } },
  };

  // Sport-specific details — pull the full row, then funnel into the
  // sport-agnostic `rich` shape. We deliberately select * here because the
  // row is small (one record) and the column list varies per sport.
  const detailTable = detailTableForSport(event.sportId);
  if (detailTable) {
    try {
      const { data } = await supabase
        .from(detailTable)
        .select("*")
        .eq("session_id", id)
        .maybeSingle();
      if (data) {
        extras.durationMinutes = data.duration_minutes ?? null;
        extras.capacity = data.capacity ?? null;
        extras.rich = mapDetailRowToRich(event.sportId, data);
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

// ─── Sport detail-row → SessionRichDetails mapper ────────────────────────────
//
// One mapper per sport. Each pulls the columns that exist in that sport's
// detail table and projects them into the sport-agnostic `SessionRichDetails`
// shape. Anything missing falls back to null/empty so the renderer can guard.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDetailRowToRich(sportId: string, row: any): SessionRichDetails {
  const base: SessionRichDetails = {
    ...EMPTY_RICH,
    amenities: { ...EMPTY_RICH.amenities },
  };
  if (!row) return base;

  // Common fields present on most/all detail tables
  base.description = row.description ?? null;
  base.skillLevel = humanise(row.skill_level);
  base.genderPreference = humanise(row.gender_preference);
  base.hostPlaying = typeof row.host_playing === "boolean" ? row.host_playing : null;
  base.womenOnly = typeof row.women_only === "boolean" ? row.women_only : null;
  base.whatToBring = normaliseStringArray(row.what_to_bring);
  base.houseRules = normaliseStringArray(row.house_rules ?? row.rules);
  base.additionalNotes = row.additional_notes ?? null;
  base.meetingInstructions = row.meeting_instructions ?? null;
  base.parkingInfo = row.parking_info ?? row.parking_notes ?? null;
  base.publicTransportInfo = row.public_transport_info ?? null;
  base.amenities = {
    changingRooms: !!row.changing_rooms_available,
    showers: !!row.showers_available,
    parking: !!row.parking_available,
    refreshments: !!row.refreshments_available,
    waterFountain: !!row.water_fountain_available,
  };

  switch (sportId) {
    case "football":
      base.gameFormat = humanise(row.game_format);
      base.matchType = humanise(row.match_type);
      base.pitchType = humanise(row.pitch_type);
      base.ballProvided = typeof row.ball_provided === "boolean" ? row.ball_provided : null;
      base.bibsProvided = typeof row.bibs_provided === "boolean" ? row.bibs_provided : null;
      break;

    case "basketball":
      base.gameFormat = humanise(row.game_format);
      base.matchType = humanise(row.match_type);
      base.courtType = humanise(row.court_type);
      base.courtNumber = row.court_number ?? null;
      base.ballProvided = typeof row.ball_provided === "boolean" ? row.ball_provided : null;
      break;

    case "cycling":
      base.distanceKm =
        typeof row.distance_km === "number" ? row.distance_km : null;
      base.routeType = humanise(row.route_type);
      base.terrainType = humanise(row.terrain_type);
      base.surfaceType = humanise(row.surface_type);
      base.elevationGainM =
        typeof row.elevation_gain_m === "number" ? row.elevation_gain_m : null;
      base.rideIntensity = humanise(row.ride_intensity);
      base.hasCoffeeStop =
        typeof row.has_coffee_stop === "boolean" ? row.has_coffee_stop : null;
      base.bikeType = humanise(row.bike_type);
      base.noDropRide =
        typeof row.no_drop_ride === "boolean" ? row.no_drop_ride : null;
      base.startTitle = row.start_title ?? null;
      base.finishTitle = row.finish_title ?? null;
      break;

    case "running":
      base.distanceKm =
        typeof row.distance_km === "number" ? row.distance_km : null;
      base.routeType = humanise(row.route_type);
      base.terrainType = humanise(row.terrain_type);
      base.surfaceType = humanise(row.surface_type);
      base.elevationGainM =
        typeof row.elevation_gain_m === "number" ? row.elevation_gain_m : null;
      base.paceType = humanise(row.pace_type);
      base.startTitle = row.start_title ?? null;
      base.finishTitle = row.finish_title ?? null;
      break;

    case "gym":
      base.sessionType = humanise(row.session_type);
      base.focusArea = humanise(row.focus_area);
      base.requiresMembership =
        typeof row.requires_membership === "boolean"
          ? row.requires_membership
          : null;
      base.meetingPointTitle = row.meeting_point_title ?? null;
      // gym rules live in `rules` column, already handled above
      break;

    // Racket sports (tennis, badminton, squash, padel, pickleball, table_tennis)
    default: {
      base.gameFormat = humanise(row.game_format);
      base.matchType = humanise(row.match_type);
      base.courtType = humanise(row.court_type);
      base.courtSurface = humanise(row.court_surface);
      base.courtNumber = row.court_number ?? null;
      base.equipmentProvided =
        typeof row.equipment_provided === "boolean"
          ? row.equipment_provided
          : null;
      base.ballsProvided =
        typeof row.balls_provided === "boolean" ? row.balls_provided : null;
      base.numberOfSets =
        typeof row.number_of_sets === "number" ? row.number_of_sets : null;
      base.gamesPerSet =
        typeof row.games_per_set === "number" ? row.games_per_set : null;
      base.scoringSystem = humanise(row.scoring_system);
      base.ownRacketRequired =
        typeof row.own_racket_required === "boolean"
          ? row.own_racket_required
          : null;
      base.coachPresent =
        typeof row.coach_present === "boolean" ? row.coach_present : null;
      base.coachName = row.coach_name ?? null;
      base.warmUpMinutes =
        typeof row.warm_up_minutes === "number" ? row.warm_up_minutes : null;
      break;
    }
  }

  return base;
}

// ─── Cross-link helpers (host + venue lookups for internal linking) ──────────

export interface HostMoreSession {
  id: string;
  title: string;
  startsAt: string;
  sportId: string;
  locationArea: string;
  joinPricePence: number;
}

/**
 * Other upcoming sessions hosted by the same person. Powers the
 * "More from this host" block on /events/[id] — internal linking that
 * spreads PageRank to the host's other listings.
 */
export async function getOtherSessionsByHost(
  hostId: string,
  excludeSessionId: string,
  limit = 3
): Promise<HostMoreSession[]> {
  if (!hostId) return [];
  try {
    const { data } = await supabase
      .from("sessions")
      .select(
        "id, title, starts_at, sport_id, location_area, join_price_pence"
      )
      .eq("is_cancelled", false)
      .eq("host_id", hostId)
      .neq("id", excludeSessionId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      sportId: row.sport_id,
      locationArea: row.location_area ?? "",
      joinPricePence: row.join_price_pence ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Resolve a partner_venues row by best-effort match against an event's
 * place_name + city. Used to render a "View venue" deep-link from session
 * pages into /venues/[slug] so crawlers can traverse session ↔ venue ↔ city.
 *
 * Returns null if no match or partner_venues is unavailable.
 */
export async function resolvePartnerVenueForSession(
  placeName: string,
  city: string
): Promise<{ slug: string; name: string } | null> {
  const trimmedName = (placeName ?? "").trim();
  if (!trimmedName) return null;

  try {
    const { data } = await supabase
      .from("partner_venues")
      .select("name, address")
      .eq("is_active", true)
      .ilike("name", trimmedName);
    if (!data || data.length === 0) return null;

    // Prefer a match whose address city matches the event's city
    const cityKey = citySlug(city);
    let chosen = data.find((row) => {
      const rowCity = String(row.address ?? "")
        .split(",")
        .slice(-2)[0]
        ?.trim() ?? "";
      return citySlug(rowCity) === cityKey;
    });
    if (!chosen) chosen = data[0];

    const rowCity = String(chosen.address ?? "")
      .split(",")
      .slice(-2)[0]
      ?.trim() ?? "";
    const namePart = citySlug(chosen.name ?? "");
    const cityPart = citySlug(rowCity);
    if (!namePart && !cityPart) return null;
    const slug = namePart && cityPart ? `${namePart}-${cityPart}` : namePart || cityPart;
    return { slug, name: chosen.name ?? "" };
  } catch {
    return null;
  }
}

// ─── SEO copy generators (sport-aware meta description + keywords) ───────────

/**
 * Build a richly-detailed meta description for a single session. Pulls
 * sport-specific facts (game format, skill level, pitch type, distance, etc.)
 * into the visible meta tag — this is what Google and AI engines summarise
 * in SERP snippets, so the more specific the better.
 */
export function buildSessionMetaDescription(args: {
  sportId: string;
  sportName: string;
  sportEmoji: string;
  title: string;
  venue: string;
  city: string;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
  spotsLeft: number;
  rich: SessionRichDetails;
}): string {
  const {
    sportEmoji: emoji,
    sportName,
    venue,
    city,
    dateLabel,
    timeLabel,
    priceLabel,
    spotsLeft,
    rich,
  } = args;

  const facts: string[] = [];
  if (rich.gameFormat) facts.push(rich.gameFormat);
  if (rich.skillLevel && rich.skillLevel.toLowerCase() !== "all levels") {
    facts.push(rich.skillLevel);
  }
  if (rich.pitchType) facts.push(rich.pitchType);
  if (rich.courtType) facts.push(rich.courtType);
  if (typeof rich.distanceKm === "number" && rich.distanceKm > 0) {
    facts.push(`${rich.distanceKm.toFixed(1)}km`);
  }
  if (rich.paceType) facts.push(`${rich.paceType} pace`);
  if (rich.routeType) facts.push(`${rich.routeType} route`);
  if (rich.focusArea) facts.push(rich.focusArea);

  const factsLine = facts.length > 0 ? facts.join(" · ") + ". " : "";

  const spotsText =
    spotsLeft <= 0
      ? "Session full."
      : spotsLeft <= 3
      ? `Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.`
      : `${spotsLeft} spots open.`;

  const intro = `${emoji} ${sportName} session at ${venue}, ${city}`;
  const when = `${dateLabel} at ${timeLabel}`;
  const price =
    priceLabel === "Free" ? "Free entry." : `${priceLabel} entry.`;

  // ~155 char target for SERP snippet compliance
  const description = `${intro} — ${when}. ${factsLine}${spotsText} ${price} Book on Fittrybe.`;

  // Trim aggressively if we overshoot 200 chars
  return description.length > 200
    ? description.slice(0, 197).trimEnd() + "…"
    : description;
}

/** Sport + location keyword set, including detail-aware long-tail terms. */
export function buildSessionKeywords(args: {
  sportId: string;
  sportName: string;
  city: string;
  venue: string;
  rich: SessionRichDetails;
}): string[] {
  const { sportId, sportName, city, venue, rich } = args;
  const keywords: string[] = [
    `${sportId} near me`,
    `${sportId} ${city}`,
    `${sportName} session ${city}`,
    `${sportName} ${venue}`,
    `pickup ${sportId}`,
    `${sportId} game ${city}`,
    `find ${sportId} ${city}`,
  ];

  if (rich.gameFormat) {
    keywords.push(`${rich.gameFormat.toLowerCase()} ${city}`);
    keywords.push(`${rich.gameFormat.toLowerCase()} ${sportId}`);
  }
  if (rich.pitchType) keywords.push(`${rich.pitchType.toLowerCase()} ${sportId} ${city}`);
  if (rich.courtType) keywords.push(`${rich.courtType.toLowerCase()} ${sportId} court ${city}`);
  if (rich.skillLevel && rich.skillLevel.toLowerCase() !== "all levels") {
    keywords.push(`${rich.skillLevel.toLowerCase()} ${sportId} ${city}`);
  }
  if (typeof rich.distanceKm === "number" && rich.distanceKm > 0) {
    keywords.push(`${Math.round(rich.distanceKm)}km ${sportId} ${city}`);
  }
  keywords.push("fittrybe");
  // De-dup case-insensitively
  const seen = new Set<string>();
  return keywords.filter((k) => {
    const key = k.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}