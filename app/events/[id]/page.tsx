// app/events/[id]/page.tsx — Individual event / session detail page

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEventById,
  getAllEventIds,
  sportEmoji,
  formatEventDate,
  formatEventTime,
  formatPrice,
} from "@/lib/events";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import { buildBreadcrumbSchema, buildEventSchema, buildGraphSchema, buildWebPageSchema } from "@/lib/structured-data";

export const revalidate = 60;

export async function generateStaticParams() {
  const ids = await getAllEventIds();
  return ids.map((id) => ({ id }));
}

function resolveOGImage(event: {
  bannerUrl: string | null;
  title: string;
  locationArea: string;
  sportId: string;
  startsAt: string;
  joinPricePence: number;
}): string {
  if (event.bannerUrl && event.bannerUrl.startsWith("http")) {
    return event.bannerUrl;
  }
  const params = new URLSearchParams({
    title: event.title,
    description: event.locationArea,
    sport: event.sportId,
    date: formatEventDate(event.startsAt),
    price: formatPrice(event.joinPricePence),
  });
  return `${seoConfig.siteUrl}/api/og?${params.toString()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "Session Not Found" };

  const canonicalUrl = buildCanonicalUrl(`/events/${id}`);
  const ogImage = resolveOGImage(event);
  const spotsText =
    event.spotsLeft <= 0
      ? "Session full"
      : event.spotsLeft <= 3
      ? `Only ${event.spotsLeft} spot${event.spotsLeft === 1 ? "" : "s"} left`
      : `${event.spotsLeft} spots available`;

  const description = `${sportEmoji(event.sportId)} ${
    event.sportId.charAt(0).toUpperCase() + event.sportId.slice(1)
  } session at ${event.placeName || event.locationLabel}, ${
    event.locationArea
  } — ${formatEventDate(event.startsAt)} at ${formatEventTime(
    event.startsAt
  )}. ${spotsText}. ${formatPrice(event.joinPricePence)} entry. Book via Fittrybe.`;

  return {
    title: `${event.title} — ${formatEventDate(event.startsAt)} | Fittrybe`,
    description,
    alternates: { canonical: canonicalUrl },
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
  const event = await getEventById(id);

  if (!event) notFound();

  const canonicalUrl = buildCanonicalUrl(`/events/${id}`);
  const ogImage = resolveOGImage(event);
  const emoji = sportEmoji(event.sportId);
  const dateStr = formatEventDate(event.startsAt);
  const timeStr = formatEventTime(event.startsAt);
  const price = formatPrice(event.joinPricePence);
  const coverImage = event.bannerUrl || event.placePhotoUrl;
  const isFull = event.spotsLeft === 0;
  const isLowSpots = event.spotsLeft > 0 && event.spotsLeft <= 3;

  const pageJsonLd = buildGraphSchema([
    buildEventSchema({
      title: event.title,
      description: event.description ?? null,
      startsAt: event.startsAt,
      placeName: event.placeName || event.locationLabel,
      placeVicinity: event.placeVicinity,
      locationArea: event.locationArea,
      placeLat: event.placeLat,
      placeLng: event.placeLng,
      joinPricePence: event.joinPricePence,
      spotsLeft: event.spotsLeft,
      isCancelled: event.isCancelled,
      ogImage,
      canonicalUrl,
    }),
    buildWebPageSchema({
      url: canonicalUrl,
      title: event.title,
      description: `${event.sportId} session at ${event.placeName}`,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Events", url: buildCanonicalUrl("/events") },
        { name: event.title, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Events", url: buildCanonicalUrl("/events") },
      { name: event.title, url: canonicalUrl },
    ]),
  ]);

  // Use place name + area for a clean, reliable Maps search (no invalid UUIDs)
  const mapsQuery = encodeURIComponent(
    `${event.placeName || event.locationLabel} ${event.locationArea}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

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
            className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black tracking-tight text-[#B6FF00]"
          >
            FITTRYBE
          </Link>
          <Link
            href="/events"
            className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-dm-sans)]"
          >
            ← All sessions
          </Link>
        </nav>

        <article className="max-w-4xl mx-auto px-6 py-12">
          {/* Sport badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20">
              {emoji} {event.sportId}
            </span>
            {event.isFeatured && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <header className="mb-8">
            <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              {event.title}
            </h1>

            {/* Cancelled banner */}
            {event.isCancelled && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
                <span className="text-red-400 text-xl">⚠️</span>
                <p className="text-red-400 font-medium font-[family-name:var(--font-dm-sans)]">
                  This session has been cancelled.
                  {event.cancellationReason && (
                    <span className="text-red-400/70 ml-1">
                      ({event.cancellationReason.replace(/_/g, " ")})
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Key details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-[family-name:var(--font-dm-sans)]">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Date</p>
                <p className="text-white font-semibold text-sm">{dateStr}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Time</p>
                <p className="text-white font-semibold text-sm">{timeStr}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Entry</p>
                <p className={`font-semibold text-sm ${event.joinPricePence === 0 ? "text-[#B6FF00]" : "text-white"}`}>
                  {price}
                  {event.joinPricePence > 0 && (
                    <span className="text-white/40 text-xs font-normal ml-1">({event.paymentMethod})</span>
                  )}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Spots</p>
                <p className={`font-semibold text-sm ${isFull ? "text-red-400" : isLowSpots ? "text-orange-400" : "text-white"}`}>
                  {isFull ? "Full" : `${event.spotsLeft} left`}
                </p>
              </div>
            </div>
          </header>

          {/* Banner image */}
          {coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Session description (host-provided) */}
          {event.description && (
            <section className="mb-10">
              <h2 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
                About This Session
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-dm-sans)]">
                <p className="text-white/80 text-base leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </section>
          )}

          {/* Location */}
          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-bold uppercase tracking-tight text-white mb-4">
              📍 Location
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-[family-name:var(--font-dm-sans)]">
              <p className="text-white font-semibold text-lg mb-1">
                {event.placeName || event.locationLabel}
              </p>
              {event.placeVicinity && (
                <p className="text-white/60 text-sm mb-1">{event.placeVicinity}</p>
              )}
              <p className="text-white/40 text-sm mb-4">{event.locationArea}</p>
              {event.placeRating && (
                <p className="text-white/50 text-xs mb-4">
                  ⭐ {event.placeRating} on Google
                </p>
              )}
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
            </div>
          </section>

          {/* Stats row */}
          <section className="mb-10">
            <div className="flex gap-6 font-[family-name:var(--font-dm-sans)] text-sm text-white/40">
              <span>{event.participantsCount} joined</span>
              {event.isRecurring && <span>🔄 Recurring</span>}
            </div>
          </section>

          {/* CTA footer */}
          <footer className="mt-10 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            {event.isCancelled ? (
              <>
                <p className="text-white/60 mb-4 font-[family-name:var(--font-dm-sans)]">
                  This session was cancelled. Browse other upcoming sessions.
                </p>
                <Link
                  href="/events"
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
                >
                  See All Sessions
                </Link>
              </>
            ) : isFull ? (
              <>
                <p className="text-white/60 mb-4 font-[family-name:var(--font-dm-sans)]">
                  This session is full. Join Fittrybe to get notified when spots open up.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
                >
                  Join Fittrybe — Get Notified
                </Link>
              </>
            ) : (
              <>
                <p className="text-white/60 mb-2 font-[family-name:var(--font-dm-sans)]">
                  {isLowSpots ? `Only ${event.spotsLeft} spot${event.spotsLeft === 1 ? "" : "s"} left!` : "Ready to play?"}
                </p>
                <p className="text-white/40 text-sm mb-6 font-[family-name:var(--font-dm-sans)]">
                  Download the Fittrybe app to reserve your spot.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
                >
                  Join Fittrybe — Reserve Your Spot
                </Link>
              </>
            )}
          </footer>
        </article>
      </main>
    </>
  );
}