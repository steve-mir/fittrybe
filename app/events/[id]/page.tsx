// app/events/[id]/page.tsx — Individual event / session detail page

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  buildSessionKeywords,
  buildSessionMetaDescription,
  citySlug,
  formatEventDate,
  formatEventTime,
  formatPrice,
  getEventWithExtras,
  getOtherSessionsByHost,
  getRelatedEvents,
  resolvePartnerVenueForSession,
  sportEmoji,
  sportLabel,
} from "@/lib/events";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import {
  buildBreadcrumbSchema,
  buildEventSchema,
  buildGraphSchema,
  buildWebPageSchema,
} from "@/lib/structured-data";
import EventCard from "@/components/EventCard";

export const revalidate = 60;

// Past events still need to resolve (deep-links shared after the fact remain
// valid) but we deliberately do NOT prebuild every event ID — the listing
// changes too often and the build would balloon. ISR handles long-tail traffic.
export const dynamicParams = true;

function resolveOGImage(
  event: {
    bannerUrl: string | null;
    title: string;
    locationArea: string;
    sportId: string;
    startsAt: string;
    joinPricePence: number;
    placeName: string;
    locationLabel: string;
  },
  descriptionOverride?: string
): string {
  if (event.bannerUrl && event.bannerUrl.startsWith("http")) {
    return event.bannerUrl;
  }
  // Prefer a sport-aware description (e.g. "5-a-side · Astroturf · Beginner")
  // over the bare city name — gives shared previews more pull.
  const venue = event.placeName || event.locationLabel || event.locationArea;
  const description = descriptionOverride ?? `${venue} · ${event.locationArea}`;
  const params = new URLSearchParams({
    title: event.title,
    description,
    sport: event.sportId,
    date: formatEventDate(event.startsAt),
    price: formatPrice(event.joinPricePence),
  });
  return `${seoConfig.siteUrl}/api/og?${params.toString()}`;
}

function isEventPast(startsAt: string, durationMinutes: number | null): boolean {
  const start = new Date(startsAt).getTime();
  const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  return Date.now() > start + minutes * 60_000;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getEventWithExtras(id);
  if (!result) {
    return {
      title: "Session Not Found",
      robots: { index: false, follow: false },
    };
  }
  const { event, extras } = result;

  const canonicalUrl = buildCanonicalUrl(`/events/${id}`);
  const isPast = isEventPast(event.startsAt, extras.durationMinutes);
  const shouldNoindex = event.isCancelled || isPast;

  // Build a sport-fact OG subtitle ("5-a-side · Astroturf · Beginner") when
  // we have rich data; otherwise fall back to venue + city.
  const ogFacts = [
    extras.rich.gameFormat,
    extras.rich.pitchType,
    extras.rich.courtType,
    extras.rich.skillLevel && extras.rich.skillLevel.toLowerCase() !== "all levels"
      ? extras.rich.skillLevel
      : null,
  ].filter(Boolean) as string[];
  const ogSubtitle =
    ogFacts.length > 0
      ? ogFacts.join(" · ")
      : `${event.placeName || event.locationLabel} · ${event.locationArea}`;
  const ogImage = resolveOGImage(event, ogSubtitle);

  const spotsText =
    event.spotsLeft <= 0
      ? "Session full"
      : event.spotsLeft <= 3
      ? `Only ${event.spotsLeft} spot${event.spotsLeft === 1 ? "" : "s"} left`
      : `${event.spotsLeft} spots available`;

  const sportName = sportLabel(event.sportId);
  const venuePart = event.placeName || event.locationLabel;

  // Sport-aware description folds in skill level, game format, pitch type,
  // distance — the unique facts that differentiate this session from generic
  // "football near me" pages and earn long-tail SERP visibility.
  const description = buildSessionMetaDescription({
    sportId: event.sportId,
    sportName,
    sportEmoji: sportEmoji(event.sportId),
    title: event.title,
    venue: venuePart,
    city: event.locationArea,
    dateLabel: formatEventDate(event.startsAt),
    timeLabel: formatEventTime(event.startsAt),
    priceLabel: formatPrice(event.joinPricePence),
    spotsLeft: event.spotsLeft,
    rich: extras.rich,
  });
  // Keep spotsText in scope for any future use; the description already folds
  // it in via buildSessionMetaDescription.
  void spotsText;

  // Per-event keywords mix sport, location, and intent — feeds long-tail
  // queries like "five-a-side astroturf redhill saturday".
  const keywords = buildSessionKeywords({
    sportId: event.sportId,
    sportName,
    city: event.locationArea,
    venue: venuePart,
    rich: extras.rich,
  });

  return {
    title: `${event.title} — ${formatEventDate(event.startsAt)} | Fittrybe`,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    robots: shouldNoindex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true, "max-snippet": 0 },
        }
      : seoConfig.robotsDefault,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.siteLocale,
      title: event.title,
      description,
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: event.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      title: event.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEventWithExtras(id);

  if (!result) notFound();
  const { event, extras } = result;

  const canonicalUrl = buildCanonicalUrl(`/events/${id}`);
  // Mirror the metadata-side enriched OG subtitle so the schema's image:[]
  // entry matches the og:image URL used by social crawlers — same cached
  // asset, no double-render.
  const bodyOgFacts = [
    extras.rich.gameFormat,
    extras.rich.pitchType,
    extras.rich.courtType,
    extras.rich.skillLevel && extras.rich.skillLevel.toLowerCase() !== "all levels"
      ? extras.rich.skillLevel
      : null,
  ].filter(Boolean) as string[];
  const ogImage = resolveOGImage(
    event,
    bodyOgFacts.length > 0 ? bodyOgFacts.join(" · ") : undefined
  );
  const emoji = sportEmoji(event.sportId);
  const dateStr = formatEventDate(event.startsAt);
  const timeStr = formatEventTime(event.startsAt);
  const price = formatPrice(event.joinPricePence);
  const coverImage = event.bannerUrl || event.placePhotoUrl;
  const isFull = event.spotsLeft === 0;
  const isLowSpots = event.spotsLeft > 0 && event.spotsLeft <= 3;
  const isPast = isEventPast(event.startsAt, extras.durationMinutes);
  const sportName = sportLabel(event.sportId);
  const cityHref = `/events/in/${citySlug(event.locationArea)}`;
  const sportCityHref = `/events/${event.sportId}/in/${citySlug(event.locationArea)}`;

  const computedEndDate = new Date(
    new Date(event.startsAt).getTime() +
      (extras.durationMinutes && extras.durationMinutes > 0
        ? extras.durationMinutes
        : 60) *
        60_000
  ).toISOString();

  const parentSessionUrl = event.parentSessionId
    ? buildCanonicalUrl(`/events/${event.parentSessionId}`)
    : null;

  const eventSchema = buildEventSchema({
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    startsAt: event.startsAt,
    endsAt: computedEndDate,
    durationMinutes: extras.durationMinutes,
    placeName: event.placeName || event.locationLabel,
    placeVicinity: event.placeVicinity,
    locationArea: event.locationArea,
    placeLat: event.placeLat,
    placeLng: event.placeLng,
    joinPricePence: event.joinPricePence,
    spotsLeft: event.spotsLeft,
    capacity: extras.capacity,
    isCancelled: event.isCancelled,
    previousStartDate: event.isCancelled ? event.startsAt : null,
    ogImage,
    canonicalUrl,
    sportId: event.sportId,
    hostName: extras.hostName,
    hostUrl: extras.hostUsername
      ? `${seoConfig.siteUrl}/u/${extras.hostUsername}`
      : null,
    parentSessionUrl,
    aggregateRating: extras.reviewSummary,
    keywords: [
      `${event.sportId} near me`,
      `${sportName} ${event.locationArea}`,
      event.placeName || event.locationLabel,
    ],
  });

  const pageJsonLd = buildGraphSchema([
    eventSchema,
    buildWebPageSchema({
      url: canonicalUrl,
      title: event.title,
      description: `${sportName} session at ${event.placeName || event.locationLabel} — ${dateStr} ${timeStr}. Book on Fittrybe.`,
      datePublished: event.createdAt,
      dateModified: event.updatedAt ?? event.createdAt,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Events", url: buildCanonicalUrl("/events") },
        { name: event.locationArea, url: buildCanonicalUrl(cityHref) },
        { name: event.title, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Events", url: buildCanonicalUrl("/events") },
      { name: event.locationArea, url: buildCanonicalUrl(cityHref) },
      { name: event.title, url: canonicalUrl },
    ]),
  ]);

  // Place name + area is more reliable for Maps than the synthetic UUID query
  const mapsQuery = encodeURIComponent(
    `${event.placeName || event.locationLabel} ${event.locationArea}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Cross-links — feed crawlers into the host's other listings and into the
  // partner-venue page when one exists. Failures here never block the render.
  const [relatedEvents, hostMore, partnerVenue] = await Promise.all([
    getRelatedEvents(event, 3),
    getOtherSessionsByHost(event.hostId, event.id, 3),
    resolvePartnerVenueForSession(
      event.placeName || event.locationLabel,
      event.locationArea
    ),
  ]);

  const rich = extras.rich;
  // A "section is renderable" guard the JSX uses repeatedly to keep the markup
  // free of empty headers when the host left a sport-specific field blank.
  const hasFacts =
    !!(
      rich.skillLevel ||
      rich.gameFormat ||
      rich.matchType ||
      rich.pitchType ||
      rich.courtType ||
      rich.courtSurface ||
      rich.sessionType ||
      rich.focusArea ||
      rich.bikeType ||
      rich.paceType ||
      rich.routeType
    );
  const hasWhatToBring = rich.whatToBring.length > 0;
  const hasHouseRules = rich.houseRules.length > 0;
  const hasAmenities =
    rich.amenities.changingRooms ||
    rich.amenities.showers ||
    rich.amenities.parking ||
    rich.amenities.refreshments ||
    rich.amenities.waterFountain;
  const hasMeetingInfo =
    !!(rich.meetingInstructions || rich.meetingPointTitle || rich.parkingInfo || rich.publicTransportInfo);
  const hasRouteFacts =
    !!(rich.distanceKm || rich.elevationGainM || rich.routeType || rich.terrainType || rich.surfaceType);
  const hasRacketFacts =
    !!(rich.numberOfSets || rich.gamesPerSet || rich.scoringSystem || rich.warmUpMinutes || rich.coachPresent);

  // Pre-build the venue page href when partner venue resolved
  const venuePageHref = partnerVenue ? `/venues/${partnerVenue.slug}` : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        {/* Nav */}
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link
            href="/"
            aria-label="Fittrybe — return to homepage"
            className="inline-flex items-center"
          >
            <Wordmark height={28} />
          </Link>
          <Link
            href="/events"
            className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)]"
          >
            ← All sessions
          </Link>
        </nav>

        <article className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumb (visible) — strengthens internal linking + accessibility */}
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
              <li>
                <Link href={cityHref} className="hover:text-[#B6FF00] transition-colors">
                  {event.locationArea}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={sportCityHref} className="hover:text-[#B6FF00] transition-colors">
                  {sportName}
                </Link>
              </li>
            </ol>
          </nav>

          {/* Sport badge */}
          <div className="mb-6">
            <Link
              href={sportCityHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20 hover:bg-[#B6FF00]/20 transition-colors"
            >
              {emoji} {sportName}
            </Link>
            {event.isFeatured && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                ⭐ Featured
              </span>
            )}
            {event.isRecurring && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                🔄 Recurring
              </span>
            )}
          </div>

          {/* Title */}
          <header className="mb-8">
            <h1 className="font-[family-name:var(--font-anton)] text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              {event.title}
            </h1>

            {/* Past-event banner — keep page useful even after the session */}
            {isPast && !event.isCancelled && (
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
                <span className="text-white/60 text-xl">⌛</span>
                <p className="text-white/70 font-medium font-[family-name:var(--font-inter-tight)]">
                  This session has already happened. Browse upcoming{" "}
                  <Link href={sportCityHref} className="text-[#B6FF00] hover:underline">
                    {sportName.toLowerCase()} sessions in {event.locationArea}
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Cancelled banner */}
            {event.isCancelled && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
                <span className="text-red-400 text-xl">⚠️</span>
                <p className="text-red-400 font-medium font-[family-name:var(--font-inter-tight)]">
                  This session has been cancelled.
                  {event.cancellationReason && (
                    <span className="text-red-400/70 ml-1">
                      ({event.cancellationReason.replace(/_/g, " ")})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Key details — `<time>` carries machine-readable datetime */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-[family-name:var(--font-inter-tight)]">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Date</p>
                <time
                  dateTime={event.startsAt}
                  className="text-white font-semibold text-sm block"
                >
                  {dateStr}
                </time>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Time</p>
                <time
                  dateTime={event.startsAt}
                  className="text-white font-semibold text-sm block"
                >
                  {timeStr}
                </time>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Entry</p>
                <p
                  className={`font-semibold text-sm ${
                    event.joinPricePence === 0 ? "text-[#B6FF00]" : "text-white"
                  }`}
                >
                  {price}
                  {event.joinPricePence > 0 && (
                    <span className="text-white/40 text-xs font-normal ml-1">
                      ({event.paymentMethod})
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Spots</p>
                <p
                  className={`font-semibold text-sm ${
                    isFull ? "text-red-400" : isLowSpots ? "text-orange-400" : "text-white"
                  }`}
                >
                  {isFull
                    ? "Full"
                    : `${event.spotsLeft}${extras.capacity ? ` of ${extras.capacity}` : ""} left`}
                </p>
              </div>
            </div>

            {/* Host attribution — fills SportsEvent.performer */}
            {extras.hostName && (
              <p className="mt-6 text-sm text-white/50 font-[family-name:var(--font-inter-tight)]">
                Hosted by{" "}
                {extras.hostUsername ? (
                  <Link
                    href={`/u/${extras.hostUsername}`}
                    className="text-white hover:text-[#B6FF00] transition-colors"
                    rel="author"
                  >
                    {extras.hostName}
                  </Link>
                ) : (
                  <span className="text-white">{extras.hostName}</span>
                )}
              </p>
            )}
          </header>

          {/* Banner image — next/image gives us responsive srcset + AVIF */}
          {coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/9] relative bg-white/5">
              <Image
                src={coverImage}
                alt={`${event.title} — ${sportName} at ${event.placeName || event.locationLabel}, ${event.locationArea}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Session description — prefer host-written content; fall back to
              the sport-specific detail row description if the parent session
              row is blank. Either is unique, indexable text per session. */}
          {(event.description || rich.description) && (
            <section className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                About This Session
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <p className="text-white/80 text-base leading-relaxed whitespace-pre-line">
                  {event.description || rich.description}
                </p>
                {rich.additionalNotes && (
                  <p className="mt-4 pt-4 border-t border-white/10 text-white/70 text-sm leading-relaxed whitespace-pre-line">
                    <span className="text-[#B6FF00] font-semibold">Note from host:</span>{" "}
                    {rich.additionalNotes}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Quick facts chip row — every chip is a sport-specific keyword
              ("5-a-side", "Astroturf", "Beginner") indexed in the document */}
          {hasFacts && (
            <section
              aria-label="Session details"
              className="mb-10"
            >
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                Session Details
              </h2>
              <ul className="flex flex-wrap gap-2 font-[family-name:var(--font-inter-tight)]">
                {rich.gameFormat && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
                    🎯 {rich.gameFormat}
                  </li>
                )}
                {rich.matchType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    {rich.matchType} match
                  </li>
                )}
                {rich.skillLevel && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    📊 {rich.skillLevel}
                  </li>
                )}
                {rich.pitchType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    🥅 {rich.pitchType} pitch
                  </li>
                )}
                {rich.courtType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    🏟 {rich.courtType} court
                  </li>
                )}
                {rich.courtSurface && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    {rich.courtSurface} surface
                  </li>
                )}
                {rich.courtNumber && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    Court {rich.courtNumber}
                  </li>
                )}
                {rich.sessionType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    {rich.sessionType}
                  </li>
                )}
                {rich.focusArea && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    💪 {rich.focusArea}
                  </li>
                )}
                {rich.bikeType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    🚲 {rich.bikeType}
                  </li>
                )}
                {rich.paceType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    {rich.paceType} pace
                  </li>
                )}
                {rich.routeType && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                    {rich.routeType} route
                  </li>
                )}
                {rich.womenOnly && (
                  <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                    Women only
                  </li>
                )}
                {rich.genderPreference &&
                  rich.genderPreference.toLowerCase() !== "everyone" &&
                  !rich.womenOnly && (
                    <li className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 text-white/80 border border-white/10">
                      {rich.genderPreference}
                    </li>
                  )}
              </ul>
            </section>
          )}

          {/* Sport-specific endurance facts (cycling / running) — distance,
              elevation, terrain. Crawlable copy that exactly matches the
              long-tail queries runners and cyclists actually make. */}
          {hasRouteFacts && (
            <section aria-label="Route information" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                The Route
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-[family-name:var(--font-inter-tight)]">
                {typeof rich.distanceKm === "number" && rich.distanceKm > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Distance
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                )}
                {typeof rich.elevationGainM === "number" && rich.elevationGainM > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Elevation
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.elevationGainM} m
                    </p>
                  </div>
                )}
                {rich.routeType && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Type
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.routeType}
                    </p>
                  </div>
                )}
                {rich.terrainType && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Terrain
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.terrainType}
                    </p>
                  </div>
                )}
                {rich.surfaceType && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Surface
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.surfaceType}
                    </p>
                  </div>
                )}
                {rich.rideIntensity && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Intensity
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.rideIntensity}
                    </p>
                  </div>
                )}
              </div>
              {(rich.startTitle || rich.finishTitle) && (
                <p className="mt-4 text-sm text-white/60 font-[family-name:var(--font-inter-tight)]">
                  {rich.startTitle && (
                    <>
                      <span className="text-[#B6FF00]">Start:</span> {rich.startTitle}
                    </>
                  )}
                  {rich.startTitle && rich.finishTitle && <span className="mx-2">·</span>}
                  {rich.finishTitle && (
                    <>
                      <span className="text-[#B6FF00]">Finish:</span> {rich.finishTitle}
                    </>
                  )}
                </p>
              )}
              {rich.hasCoffeeStop && (
                <p className="mt-2 text-sm text-white/60 font-[family-name:var(--font-inter-tight)]">
                  ☕ Includes coffee stop
                </p>
              )}
            </section>
          )}

          {/* Racket-sport match facts (sets, scoring, equipment) */}
          {hasRacketFacts && (
            <section aria-label="Match format" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                Match Format
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-[family-name:var(--font-inter-tight)]">
                {rich.numberOfSets && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Sets
                    </p>
                    <p className="text-white font-semibold text-sm">
                      Best of {rich.numberOfSets}
                    </p>
                  </div>
                )}
                {rich.gamesPerSet && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Games / set
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.gamesPerSet}
                    </p>
                  </div>
                )}
                {rich.scoringSystem && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Scoring
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.scoringSystem}
                    </p>
                  </div>
                )}
                {typeof rich.warmUpMinutes === "number" && rich.warmUpMinutes > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                      Warm-up
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {rich.warmUpMinutes} min
                    </p>
                  </div>
                )}
              </div>
              {rich.coachPresent && (
                <p className="mt-4 text-sm text-white/60 font-[family-name:var(--font-inter-tight)]">
                  🎾 Coach present{rich.coachName ? `: ${rich.coachName}` : ""}
                </p>
              )}
            </section>
          )}

          {/* What to Bring — bulleted, scannable, keyword-rich */}
          {hasWhatToBring && (
            <section aria-label="What to bring" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                🎒 What to Bring
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <ul className="space-y-2 text-white/80">
                  {rich.whatToBring.map((item, i) => (
                    <li key={`${i}-${item}`} className="flex items-start gap-3">
                      <span className="text-[#B6FF00] mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {(rich.ballProvided !== null ||
                  rich.bibsProvided !== null ||
                  rich.equipmentProvided !== null ||
                  rich.ballsProvided !== null) && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 text-xs">
                    {rich.ballProvided && (
                      <span className="px-2 py-1 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
                        ⚽ Ball provided
                      </span>
                    )}
                    {rich.bibsProvided && (
                      <span className="px-2 py-1 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
                        🦺 Bibs provided
                      </span>
                    )}
                    {rich.equipmentProvided && (
                      <span className="px-2 py-1 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
                        ✓ Equipment provided
                      </span>
                    )}
                    {rich.ballsProvided && (
                      <span className="px-2 py-1 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
                        🎾 Balls provided
                      </span>
                    )}
                    {rich.ownRacketRequired && (
                      <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">
                        Own racket required
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* House Rules — also indexable copy and great for AI engines that
              love rule/list content for grounded responses. */}
          {hasHouseRules && (
            <section aria-label="House rules" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                📜 House Rules
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]">
                <ul className="space-y-2 text-white/80">
                  {rich.houseRules.map((rule, i) => (
                    <li key={`${i}-${rule}`} className="flex items-start gap-3">
                      <span className="text-[#B6FF00] mt-0.5">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Amenities — boolean grid, each cell a discoverable signal */}
          {hasAmenities && (
            <section aria-label="Venue amenities" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                🏟 Amenities
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-[family-name:var(--font-inter-tight)]">
                {rich.amenities.changingRooms && (
                  <li className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="text-[#B6FF00]">✓</span> Changing rooms
                  </li>
                )}
                {rich.amenities.showers && (
                  <li className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="text-[#B6FF00]">✓</span> Showers
                  </li>
                )}
                {rich.amenities.parking && (
                  <li className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="text-[#B6FF00]">✓</span> Parking
                  </li>
                )}
                {rich.amenities.refreshments && (
                  <li className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="text-[#B6FF00]">✓</span> Refreshments
                  </li>
                )}
                {rich.amenities.waterFountain && (
                  <li className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                    <span className="text-[#B6FF00]">✓</span> Water fountain
                  </li>
                )}
              </ul>
              {rich.requiresMembership && (
                <p className="mt-4 text-sm text-orange-300 font-[family-name:var(--font-inter-tight)]">
                  ⓘ Venue requires membership to enter
                </p>
              )}
            </section>
          )}

          {/* Meeting + travel info — long-form host-written copy. */}
          {hasMeetingInfo && (
            <section aria-label="Meeting and travel information" className="mb-10">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                🚏 Getting There
              </h2>
              <div className="space-y-4 font-[family-name:var(--font-inter-tight)]">
                {(rich.meetingPointTitle || rich.meetingInstructions) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#B6FF00] mb-2">
                      Meeting point
                    </h3>
                    {rich.meetingPointTitle && (
                      <p className="text-white font-semibold mb-1">
                        {rich.meetingPointTitle}
                      </p>
                    )}
                    {rich.meetingInstructions && (
                      <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                        {rich.meetingInstructions}
                      </p>
                    )}
                  </div>
                )}
                {rich.parkingInfo && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#B6FF00] mb-2">
                      🅿 Parking
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                      {rich.parkingInfo}
                    </p>
                  </div>
                )}
                {rich.publicTransportInfo && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#B6FF00] mb-2">
                      🚇 Public transport
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                      {rich.publicTransportInfo}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Location */}
          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
              📍 Location
            </h2>
            <div
              className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-inter-tight)]"
              itemScope
              itemType="https://schema.org/Place"
            >
              <p className="text-white font-semibold text-lg mb-1" itemProp="name">
                {event.placeName || event.locationLabel}
              </p>
              <div
                itemProp="address"
                itemScope
                itemType="https://schema.org/PostalAddress"
              >
                {event.placeVicinity && (
                  <p className="text-white/60 text-sm mb-1" itemProp="streetAddress">
                    {event.placeVicinity}
                  </p>
                )}
                <p className="text-white/40 text-sm mb-4">
                  <span itemProp="addressLocality">{event.locationArea}</span>
                  <meta itemProp="addressCountry" content="GB" />
                </p>
              </div>
              {event.placeRating && (
                <p className="text-white/50 text-xs mb-4">
                  ⭐ {event.placeRating} on Google
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open in Google Maps
                </a>
                {/* Venue cross-link — funnels into /venues/[slug] when the
                    event's place_name maps to a partner venue. Strengthens
                    internal-link graph and lets crawlers discover venue pages
                    from session pages. */}
                {venuePageHref && partnerVenue && (
                  <Link
                    href={venuePageHref}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[#B6FF00]/30 text-[#B6FF00] hover:bg-[#B6FF00]/10 transition-colors"
                  >
                    🏟 View {partnerVenue.name}
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Stats row */}
          <section className="mb-10">
            <div className="flex gap-6 font-[family-name:var(--font-inter-tight)] text-sm text-white/40">
              <span>{event.participantsCount} joined</span>
              {extras.durationMinutes && (
                <span>⏱ {extras.durationMinutes} min</span>
              )}
              {event.isRecurring && <span>🔄 Recurring</span>}
            </div>
          </section>

          {/* CTA footer */}
          <footer className="mt-10 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            {event.isCancelled ? (
              <>
                <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
                  This session was cancelled. Browse other upcoming sessions.
                </p>
                <Link
                  href={sportCityHref}
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
                >
                  See {sportName} in {event.locationArea}
                </Link>
              </>
            ) : isPast ? (
              <>
                <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
                  This session has finished. Find another one near you.
                </p>
                <Link
                  href={sportCityHref}
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
                >
                  See Upcoming {sportName} Sessions
                </Link>
              </>
            ) : isFull ? (
              <>
                <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
                  This session is full. Join Fittrybe to get notified when spots open up.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
                >
                  Join Fittrybe — Get Notified
                </Link>
              </>
            ) : (
              <>
                <p className="text-white/60 mb-2 font-[family-name:var(--font-inter-tight)]">
                  {isLowSpots
                    ? `Only ${event.spotsLeft} spot${event.spotsLeft === 1 ? "" : "s"} left!`
                    : "Ready to play?"}
                </p>
                <p className="text-white/40 text-sm mb-6 font-[family-name:var(--font-inter-tight)]">
                  Download the Fittrybe app to reserve your spot.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
                >
                  Join Fittrybe — Reserve Your Spot
                </Link>
              </>
            )}
          </footer>

          {/* More sessions from the same host — pure internal-link signal.
              Light-weight list (no images) so it doesn't compete visually
              with the related-events grid below it. */}
          {hostMore.length > 0 && extras.hostName && (
            <section
              aria-label={`More sessions hosted by ${extras.hostName}`}
              className="mt-16 pt-12 border-t border-white/10"
            >
              <h2 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl font-bold uppercase tracking-tight text-white mb-6">
                More from {extras.hostName}
              </h2>
              <ul className="space-y-2 font-[family-name:var(--font-inter-tight)]">
                {hostMore.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/events/${s.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#B6FF00]/40 hover:bg-white/10 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {sportEmoji(s.sportId)} {s.title}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {formatEventDate(s.startsAt)} · {s.locationArea}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          s.joinPricePence === 0
                            ? "bg-[#B6FF00]/10 text-[#B6FF00]"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {formatPrice(s.joinPricePence)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related events — internal linking + crawl depth + on-page utility */}
          {relatedEvents.length > 0 && (
            <section
              aria-label={`More ${sportName} sessions`}
              className="mt-16 pt-12 border-t border-white/10"
            >
              <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <h2 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl font-bold uppercase tracking-tight text-white">
                  More {sportName} Sessions
                </h2>
                <Link
                  href={sportCityHref}
                  className="text-sm text-[#B6FF00] hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] uppercase tracking-wider font-bold"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedEvents.map((related) => (
                  <EventCard key={related.id} event={related} />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
