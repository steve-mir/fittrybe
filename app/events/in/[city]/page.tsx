/**
 * /events/in/[city] — Programmatic city landing page.
 *
 * Targets long-tail queries like "sports near me redhill" and
 * "find a game london". Pulls live sessions in the city, exposes
 * CollectionPage + ItemList + FAQPage schema, and cross-links to
 * sport-specific variants for further crawl depth.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import EventCard from "@/components/EventCard";
import {
  citySlugToDisplay,
  getUpcomingEventCities,
  getUpcomingEventsByCitySlug,
} from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildGraphSchema,
  buildItemListSchema,
  type ItemListEvent,
} from "@/lib/structured-data";

export const revalidate = 600;
export const dynamicParams = true;

const SPORT_LINKS = [
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "basketball", label: "Basketball", emoji: "🏀" },
  { id: "tennis", label: "Tennis", emoji: "🎾" },
  { id: "badminton", label: "Badminton", emoji: "🏸" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "cycling", label: "Cycling", emoji: "🚴" },
  { id: "gym", label: "Gym", emoji: "🏋️" },
];

function buildCityFaqs(cityName: string) {
  return [
    {
      question: `How do I find sports sessions in ${cityName}?`,
      answer: `Browse the live list above to see every upcoming Fittrybe session in ${cityName}. Each card shows the venue, time, price and remaining spots — tap to view details and reserve.`,
    },
    {
      question: `What sports are available in ${cityName}?`,
      answer: `Football, basketball, tennis, badminton, running groups, cycling and gym sessions are commonly hosted in ${cityName}. Sport availability depends on local hosts — filter the list above to see what's on this week.`,
    },
    {
      question: `Are ${cityName} sessions beginner-friendly?`,
      answer: `Most are. Each session lists its skill level (Beginner, Casual or Competitive) so you can find your lane. Many ${cityName} hosts explicitly welcome solo joiners and first-timers.`,
    },
  ];
}

export async function generateStaticParams() {
  // Pre-build the top cities only — others are served via ISR on demand.
  const cities = await getUpcomingEventCities();
  return cities.slice(0, 30).map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;

  const cities = await getUpcomingEventCities();
  const match = cities.find((c) => c.slug === slug);
  const cityName = match?.name ?? citySlugToDisplay(slug);
  const eventCount = match?.count ?? 0;

  const canonicalUrl = buildCanonicalUrl(`/events/in/${slug}`);
  const title = `Sports Sessions in ${cityName} | Fittrybe`;
  const description =
    eventCount > 0
      ? `${eventCount} upcoming grassroots sports session${eventCount === 1 ? "" : "s"} in ${cityName} — football, basketball, tennis, running and more. Reserve your spot in one tap on Fittrybe.`
      : `Find grassroots sports sessions in ${cityName} on Fittrybe. Football, basketball, tennis and more — reserve your spot in one tap.`;

  const ogImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    `Play sport in ${cityName}`
  )}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    keywords: [
      `sports near me ${cityName}`,
      `sports sessions ${cityName}`,
      `find a game ${cityName}`,
      `football ${cityName}`,
      `basketball ${cityName}`,
      `tennis ${cityName}`,
      `running group ${cityName}`,
      "fittrybe",
    ],
    alternates: { canonical: canonicalUrl },
    robots:
      eventCount === 0
        ? { index: false, follow: true }
        : seoConfig.robotsDefault,
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
          alt: title,
          type: "image/png",
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

export default async function CityEventsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;

  const [events, cities] = await Promise.all([
    getUpcomingEventsByCitySlug(slug),
    getUpcomingEventCities(),
  ]);

  const cityMatch = cities.find((c) => c.slug === slug);
  // If we can't even guess at a city name, treat as 404. Otherwise render
  // a thin "no sessions yet" page that's noindexed but still useful.
  if (!cityMatch && events.length === 0) {
    notFound();
  }
  const cityName = cityMatch?.name ?? citySlugToDisplay(slug);

  const canonicalUrl = buildCanonicalUrl(`/events/in/${slug}`);
  const collectionName = `Sports Sessions in ${cityName}`;
  const collectionDescription = `Live grassroots sports sessions in ${cityName} — football, basketball, tennis, running and more.`;
  const faqs = buildCityFaqs(cityName);

  const itemListEvents: ItemListEvent[] = events.slice(0, 30).map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    sportId: e.sportId,
    placeName: e.placeName || e.locationLabel,
    locationArea: e.locationArea,
    joinPricePence: e.joinPricePence,
    spotsLeft: e.spotsLeft,
    isCancelled: e.isCancelled,
    bannerUrl: e.bannerUrl,
    placeLat: e.placeLat,
    placeLng: e.placeLng,
  }));

  const pageJsonLd = buildGraphSchema(
    [
      buildCollectionPageSchema({
        url: canonicalUrl,
        name: collectionName,
        description: collectionDescription,
        numberOfItems: events.length,
        breadcrumb: [
          { name: "Home", url: seoConfig.siteUrl },
          { name: "Events", url: buildCanonicalUrl("/events") },
          { name: cityName, url: canonicalUrl },
        ],
      }),
      buildBreadcrumbSchema([
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Events", url: buildCanonicalUrl("/events") },
        { name: cityName, url: canonicalUrl },
      ]),
      buildFAQSchema(faqs),
      ...(itemListEvents.length > 0
        ? [
            buildItemListSchema(itemListEvents, seoConfig.siteUrl, {
              name: collectionName,
              description: collectionDescription,
            }),
          ]
        : []),
    ].filter(Boolean) as Array<Record<string, unknown>>
  );

  // Collect sport tallies for this city so the cross-link block only shows
  // sports that actually have sessions
  const sportCounts = new Map<string, number>();
  for (const e of events) {
    sportCounts.set(e.sportId, (sportCounts.get(e.sportId) ?? 0) + 1);
  }

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
              All sessions
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#B6FF00] text-black hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-inter-tight)]"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        <header className="max-w-4xl mx-auto px-6 py-16 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            Sessions in {cityName}
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            Play Sport in {cityName}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)]">
            {events.length === 0
              ? `No live sessions in ${cityName} right now. Join the waitlist and we'll ping you the moment one drops.`
              : `${events.length} upcoming grassroots session${events.length === 1 ? "" : "s"} in ${cityName}. Football, basketball, tennis and more — reserve your spot in one tap.`}
          </p>
        </header>

        {/* Visible breadcrumb (also matches schema) */}
        <nav
          aria-label="Breadcrumb"
          className="max-w-6xl mx-auto px-6 mb-6 text-sm text-white/40 font-[family-name:var(--font-inter-tight)]"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/events" className="hover:text-[#B6FF00] transition-colors">
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white/70">{cityName}</li>
          </ol>
        </nav>

        {/* Sport quick-links — internal anchor text targeting "[sport] [city]" */}
        {sportCounts.size > 0 && (
          <section
            aria-label={`Sports in ${cityName}`}
            className="max-w-6xl mx-auto px-6 mb-12"
          >
            <ul className="flex flex-wrap gap-2 justify-center">
              {SPORT_LINKS.filter((s) => sportCounts.has(s.id)).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/events/${s.id}/in/${slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                  >
                    <span aria-hidden="true">{s.emoji}</span>
                    {s.label} in {cityName}
                    <span className="text-xs text-white/40">
                      {sportCounts.get(s.id)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Events grid */}
        <section
          aria-label={`Upcoming sessions in ${cityName}`}
          className="max-w-6xl mx-auto px-6 pb-20"
        >
          {events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-[family-name:var(--font-inter-tight)] mb-6">
                No upcoming sessions in {cityName} right now.
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

        {/* FAQ */}
        <section
          aria-label={`Sports in ${cityName} FAQ`}
          className="max-w-3xl mx-auto px-6 py-16 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            {cityName} Sessions FAQ
          </h2>
          <dl className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <dt className="font-[family-name:var(--font-anton)] text-lg font-bold uppercase tracking-tight text-white mb-2">
                  {faq.question}
                </dt>
                <dd className="text-white/70 text-sm font-[family-name:var(--font-inter-tight)] leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Other cities — broaden crawl coverage */}
        {cities.length > 1 && (
          <section
            aria-label="Other cities on Fittrybe"
            className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
          >
            <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-6 text-center">
              Other cities
            </h2>
            <ul className="flex flex-wrap justify-center gap-3">
              {cities
                .filter((c) => c.slug !== slug)
                .slice(0, 18)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/events/in/${c.slug}`}
                      className="inline-block text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="border-t border-white/10 py-16 text-center px-6">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Want to host a session in {cityName}?
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
