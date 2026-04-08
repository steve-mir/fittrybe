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
  participantsCount: number;
  viewsCount: number;
  isFeatured: boolean;
  hostId: string;
  createdAt: string;
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
    participantsCount: row.participants_count ?? 0,
    viewsCount: row.views_count ?? 0,
    isFeatured: row.is_featured ?? false,
    hostId: row.host_id,
    createdAt: row.created_at,
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