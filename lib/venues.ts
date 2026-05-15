/**
 * Partner venue helpers — feeds /venues/[slug] programmatic SEO pages.
 *
 * Slug convention: kebab-cased venue name + city (so two "Goals" courts in
 * different cities don't collide). The slug is derived deterministically so
 * we don't need a `slug` column on the venue table.
 */

import { supabase } from "./supabase";
import { citySlug } from "./events";

export interface PartnerVenue {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  logoUrl: string | null;
  phone: string | null;
  website: string | null;
  bookingUrl: string | null;
  rating: number | null;
  description: string | null;
  sportTypes: string[];
  amenities: string[];
  isActive: boolean;
  priority: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVenue(row: any): PartnerVenue {
  const cityFromAddress = (row.address ?? "").split(",").slice(-2)[0]?.trim() ?? "";
  const slug = venueSlug(row.name ?? "", cityFromAddress);
  return {
    id: row.id,
    slug,
    name: row.name ?? "",
    address: row.address ?? "",
    city: cityFromAddress || null,
    // partner_venues has no postal_code column today — leave as null until
    // the schema gains one. Schema.org PostalAddress.postalCode is optional.
    postalCode: null,
    lat: typeof row.lat === "number" ? row.lat : null,
    lng: typeof row.lng === "number" ? row.lng : null,
    photoUrl: row.photo_url ?? null,
    logoUrl: row.logo_url ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    bookingUrl: row.booking_url ?? null,
    rating: typeof row.rating === "number" ? row.rating : null,
    description: row.description ?? null,
    sportTypes: Array.isArray(row.sport_types) ? row.sport_types : [],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    isActive: row.is_active ?? false,
    priority: row.priority ?? 0,
  };
}

/** Stable slug derived from name + city — keeps URLs deterministic. */
export function venueSlug(name: string, city: string): string {
  const namePart = citySlug(name);
  const cityPart = citySlug(city);
  if (!namePart) return cityPart;
  if (!cityPart) return namePart;
  return `${namePart}-${cityPart}`;
}

export async function getActiveVenues(): Promise<PartnerVenue[]> {
  const { data, error } = await supabase
    .from("partner_venues")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToVenue);
}

export async function getVenueBySlug(slug: string): Promise<PartnerVenue | null> {
  // partner_venues has no slug column, so we fetch active venues and
  // resolve client-side. Volume is small (curated partners), so the cost
  // is fine; revisit if the table ever exceeds a few hundred rows.
  const venues = await getActiveVenues();
  return venues.find((v) => v.slug === slug) ?? null;
}
