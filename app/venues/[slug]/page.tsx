/**
 * /venues/[slug] — Programmatic venue landing page.
 *
 * Backed by the curated partner_venues table. Emits SportsActivityLocation
 * (LocalBusiness sub-type) JSON-LD with geo + amenities + photo, then lists
 * any live Fittrybe sessions hosted at the venue. Targets queries like
 * "[venue name] [sport]" and "[venue name] booking".
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import EventCard from "@/components/EventCard";
import { getActiveVenues, getVenueBySlug } from "@/lib/venues";
import { getUpcomingEventsByVenue, sportLabel } from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildGraphSchema,
  buildSportsLocationSchema,
} from "@/lib/structured-data";

export const revalidate = 1800; // 30 min — venue data changes rarely
export const dynamicParams = true;

export async function generateStaticParams() {
  const venues = await getActiveVenues();
  return venues.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) {
    return {
      title: "Venue Not Found",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = buildCanonicalUrl(`/venues/${slug}`);
  const sportText =
    venue.sportTypes.length > 0
      ? venue.sportTypes.map(sportLabel).join(", ")
      : "sports";
  const cityPart = venue.city ? ` in ${venue.city}` : "";

  const title = `${venue.name}${cityPart} — Book ${sportText} | Fittrybe`;
  const description =
    venue.description ??
    `${venue.name} is a Fittrybe partner venue${cityPart} hosting ${sportText} sessions. See live availability, opening info and reserve a session in one tap.`;

  const ogImage =
    venue.photoUrl && venue.photoUrl.startsWith("http")
      ? venue.photoUrl
      : `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
          venue.name
        )}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    keywords: [
      venue.name,
      `${venue.name} ${venue.city ?? ""}`.trim(),
      `${venue.name} booking`,
      ...venue.sportTypes.flatMap((s) => [
        `${s} ${venue.name}`,
        `${s} ${venue.city ?? ""}`.trim(),
      ]),
      "fittrybe",
    ].filter(Boolean) as string[],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.siteLocale,
      title,
      description,
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: venue.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  const canonicalUrl = buildCanonicalUrl(`/venues/${slug}`);
  const events = venue.city
    ? await getUpcomingEventsByVenue(venue.name, venue.city)
    : [];

  const sportText =
    venue.sportTypes.length > 0
      ? venue.sportTypes.map(sportLabel).join(", ")
      : "sports";

  const collectionName = `${venue.name} — Live Sessions`;
  const collectionDescription = `Upcoming ${sportText} sessions at ${venue.name}${venue.city ? `, ${venue.city}` : ""}.`;

  const venueSchema = buildSportsLocationSchema({
    name: venue.name,
    description: venue.description,
    url: canonicalUrl,
    address: venue.address,
    city: venue.city,
    postalCode: venue.postalCode,
    lat: venue.lat,
    lng: venue.lng,
    phone: venue.phone,
    website: venue.website,
    image: venue.photoUrl,
    sportTypes: venue.sportTypes,
    amenities: venue.amenities,
    rating: venue.rating,
  });

  const pageJsonLd = buildGraphSchema([
    venueSchema,
    buildCollectionPageSchema({
      url: canonicalUrl,
      name: collectionName,
      description: collectionDescription,
      numberOfItems: events.length,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Venues", url: buildCanonicalUrl("/venues") },
        { name: venue.name, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Venues", url: buildCanonicalUrl("/venues") },
      { name: venue.name, url: canonicalUrl },
    ]),
  ]);

  const mapsQuery = encodeURIComponent(`${venue.name} ${venue.address}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/"
            aria-label="Fittrybe — return to homepage"
            className="inline-flex items-center"
          >
            <Wordmark height={28} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              Sessions
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#B6FF00] text-black hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-inter-tight)]"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        <article className="max-w-4xl mx-auto px-6 py-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-sm text-white/40 font-[family-name:var(--font-inter-tight)]"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/events" className="hover:text-[#B6FF00] transition-colors">
                  Events
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white/70">{venue.name}</li>
            </ol>
          </nav>

          <header className="mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-3">
              {venue.city ? `Venue · ${venue.city}` : "Partner Venue"}
            </span>
            <h1 className="font-[family-name:var(--font-anton)] text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              {venue.name}
            </h1>
            <p className="text-white/60 text-base font-[family-name:var(--font-inter-tight)]">
              {venue.address}
            </p>
            {venue.rating && (
              <p className="text-white/50 text-sm mt-2">⭐ {venue.rating.toFixed(1)}</p>
            )}
          </header>

          {/* Hero photo */}
          {venue.photoUrl && (
            <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/9] relative bg-white/5">
              <Image
                src={venue.photoUrl}
                alt={`${venue.name} — partner venue${venue.city ? ` in ${venue.city}` : ""}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Description */}
          {venue.description && (
            <section className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                About {venue.name}
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <p className="text-white/80 text-base leading-relaxed">{venue.description}</p>
              </div>
            </section>
          )}

          {/* Sports + amenities + actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {venue.sportTypes.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <h2 className="font-[family-name:var(--font-anton)] text-lg font-bold uppercase tracking-tight text-[#B6FF00] mb-3">
                  Sports
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {venue.sportTypes.map((s) => (
                    <li key={s}>
                      <span className="inline-block text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                        {sportLabel(s)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {venue.amenities.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <h2 className="font-[family-name:var(--font-anton)] text-lg font-bold uppercase tracking-tight text-[#B6FF00] mb-3">
                  Amenities
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {venue.amenities.map((a) => (
                    <li key={a}>
                      <span className="inline-block text-sm px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                        {a}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Contact + booking links */}
          <section className="flex flex-wrap gap-3 mb-12 font-[family-name:var(--font-inter-tight)]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              📍 Open in Google Maps
            </a>
            {venue.phone && (
              <a
                href={`tel:${venue.phone}`}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                📞 {venue.phone}
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                🌐 Venue website
              </a>
            )}
            {venue.bookingUrl && (
              <a
                href={venue.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-[#B6FF00]/10 border border-[#B6FF00]/30 text-[#B6FF00] hover:bg-[#B6FF00]/20 transition-colors"
              >
                Book a court
              </a>
            )}
          </section>

          {/* Live sessions at this venue */}
          <section
            aria-label={`Live sessions at ${venue.name}`}
            className="mt-12"
          >
            <h2 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl font-bold uppercase tracking-tight text-white mb-6">
              Live sessions at {venue.name}
            </h2>
            {events.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center font-[family-name:var(--font-inter-tight)]">
                <p className="text-white/60 mb-6">
                  No upcoming Fittrybe sessions at {venue.name} right now.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] uppercase tracking-wide"
                >
                  Get notified
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </article>

        <section className="border-t border-white/10 py-16 text-center px-6">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Want to host a session at {venue.name}?
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
          >
            Join Fittrybe — Host for Free
          </Link>
        </section>
      </main>
    </>
  );
}
