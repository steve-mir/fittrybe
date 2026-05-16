import type { Metadata } from "next";
import {
  getUpcomingEventCities,
  getUpcomingEvents,
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
import EventCard from "@/components/EventCard";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

// Revalidate every 60 seconds so new sessions appear without a full rebuild
export const revalidate = 60;

const SPORT_FILTERS = [
  { id: "all", label: "All Sports", emoji: "" },
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "basketball", label: "Basketball", emoji: "🏀" },
  { id: "cycling", label: "Cycling", emoji: "🚴" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "badminton", label: "Badminton", emoji: "🏸" },
  { id: "tennis", label: "Tennis", emoji: "🎾" },
  { id: "gym", label: "Gym", emoji: "🏋️" },
];

const EVENTS_FAQS = [
  {
    question: "How do I find a sports session near me?",
    answer:
      "Browse the live list above or filter by your sport. Every Fittrybe session shows the venue, time, price and remaining spots upfront — tap a session to view full details and reserve.",
  },
  {
    question: "Are sessions on Fittrybe free?",
    answer:
      "Many are free. Paid sessions show the price per player on the card before you join — typically £3–£10 to cover pitch, court or coach costs.",
  },
  {
    question: "Can I join a session as a solo player?",
    answer:
      "Yes — most Fittrybe sessions are designed for solo joiners. Hosts split arrivals into balanced teams or pair you up on the day.",
  },
  {
    question: "What sports are listed on Fittrybe?",
    answer:
      "Football (5-a-side and 7-a-side), basketball, tennis, badminton, running groups, cycling, swimming, gym sessions and boxing — all hosted by real people in your area.",
  },
];

function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}): Promise<Metadata> {
  const { sport } = await searchParams;
  const activeSport = sport && sport !== "all" ? sport : null;

  const title = activeSport
    ? `${capitalise(activeSport)} Sessions Near You | Fittrybe`
    : "Find Sports Sessions Near You | Fittrybe";

  const description = activeSport
    ? `Book grassroots ${activeSport} sessions near you on Fittrybe. Find local games, reserve your spot in one tap, and meet players in your area.`
    : "Browse upcoming grassroots sports sessions on Fittrybe. Find football, basketball, cycling, badminton and more near you. Reserve your spot in one tap.";

  // All sport filter URLs canonicalise back to /events to prevent thin
  // duplicate variants competing with the sport hub at /sports/[sport].
  const canonicalUrl = buildCanonicalUrl("/events");

  const eventsOGImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    activeSport ? `${capitalise(activeSport)} Sessions Near You` : "Upcoming Sports Sessions"
  )}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.siteLocale,
      title: activeSport
        ? `${capitalise(activeSport)} Sessions Near You | Fittrybe`
        : "Upcoming Sports Sessions | Fittrybe",
      description,
      images: [
        {
          url: eventsOGImage,
          secureUrl: eventsOGImage,
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
      images: [eventsOGImage],
    },
  };
}

export default async function EventsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const [allEvents, cities] = await Promise.all([
    getUpcomingEvents(),
    getUpcomingEventCities(),
  ]);

  const activeSport = sport && sport !== "all" ? sport : null;
  const filteredEvents = activeSport
    ? allEvents.filter((e) => e.sportId === activeSport)
    : allEvents;

  const isEmpty = filteredEvents.length === 0;
  const canonicalUrl = buildCanonicalUrl("/events");

  // Map FittrybeEvent → minimal ItemListEvent shape (lib/events doesn't
  // know about structured-data, so this conversion lives at the page boundary)
  const itemListEvents: ItemListEvent[] = filteredEvents
    .slice(0, 30) // cap so the JSON-LD doesn't bloat the document
    .map((e) => ({
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

  const collectionName = activeSport
    ? `${capitalise(activeSport)} Sessions on Fittrybe`
    : "Upcoming Sports Sessions on Fittrybe";

  const collectionDescription = activeSport
    ? `Live ${activeSport} sessions across the UK — book your spot, meet your tribe.`
    : "Live sports sessions across the UK — football, basketball, tennis, badminton and more. Book your spot, meet your tribe.";

  const pageJsonLd = buildGraphSchema(
    [
      buildCollectionPageSchema({
        url: canonicalUrl,
        name: collectionName,
        description: collectionDescription,
        numberOfItems: filteredEvents.length,
        breadcrumb: [
          { name: "Home", url: seoConfig.siteUrl },
          { name: "Events", url: canonicalUrl },
        ],
      }),
      buildBreadcrumbSchema([
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Events", url: canonicalUrl },
      ]),
      buildFAQSchema(EVENTS_FAQS),
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

  return (
    <>
      {/* Noindex empty filter result pages — they're dead-end thin content */}
      {isEmpty && activeSport && (
        <meta name="robots" content="noindex, follow" />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        {/* Nav */}
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
              href="/sports"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              Sports
            </Link>
            <Link
              href="/blog"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              Blog
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#B6FF00] text-black hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-inter-tight)]"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            Live Sessions
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            Find Your Game.
            <br />
            <span className="text-[#B6FF00]">Show Up and Play.</span>
          </h1>
          {/* Location signal — geographic anchor text for local SEO */}
          <p className="text-white/60 text-lg max-w-xl mx-auto font-[family-name:var(--font-inter-tight)]">
            {activeSport
              ? `Grassroots ${activeSport} sessions in Redhill, Surrey and across the UK. Reserve your spot and meet your tribe.`
              : "Grassroots sports sessions in Redhill, Surrey and across the UK. Football, basketball, cycling and more — reserve your spot in one tap."}
          </p>
        </section>

        {/* Sport filters — link to the per-sport session page (/session/<sport>)
            so crawlers traverse to an indexable URL with its own canonical
            instead of a thin filter variant. Active "All" stays on /events. */}
        <section className="max-w-6xl mx-auto px-6 mb-10" aria-label="Filter by sport">
          <div className="flex flex-wrap gap-2 justify-center">
            {SPORT_FILTERS.map((filter) => {
              const isActive =
                (!activeSport && filter.id === "all") ||
                activeSport === filter.id;
              const href =
                filter.id === "all" ? "/events" : `/session/${filter.id}`;
              return (
                <Link
                  key={filter.id}
                  href={href}
                  className={`text-sm font-medium px-4 py-2 rounded-full transition-all font-[family-name:var(--font-inter-tight)] ${
                    isActive
                      ? "bg-[#B6FF00] text-black"
                      : "bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {filter.emoji && <span aria-hidden="true">{filter.emoji} </span>}
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Events grid */}
        <section
          className="max-w-6xl mx-auto px-6 pb-20"
          aria-label="Upcoming sessions"
        >
          {isEmpty ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-[family-name:var(--font-inter-tight)] mb-6">
                {activeSport
                  ? `No upcoming ${activeSport} sessions right now. Check back soon!`
                  : "No upcoming sessions right now. Check back soon!"}
              </p>
              <Link
                href="/waitlist"
                className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] uppercase tracking-wide"
              >
                Get notified when sessions drop
              </Link>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm font-[family-name:var(--font-inter-tight)] mb-6">
                {filteredEvents.length} session
                {filteredEvents.length !== 1 ? "s" : ""} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Browse by city — internal-link block routes crawlers into the
            programmatic /events/in/[city] pages and signals geographic
            coverage to search engines. */}
        {cities.length > 0 && (
          <section
            aria-label="Browse sessions by city"
            className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
          >
            <h2 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl font-bold uppercase tracking-tight text-white mb-6 text-center">
              Browse by city
            </h2>
            <ul className="flex flex-wrap justify-center gap-3">
              {cities.slice(0, 24).map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/events/in/${city.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                  >
                    {city.name}
                    <span className="text-xs text-white/40">{city.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ — visible content matching FAQPage schema for AI engines */}
        <section
          aria-label="Frequently asked questions"
          className="max-w-3xl mx-auto px-6 py-16 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            Sessions FAQ
          </h2>
          <dl className="space-y-6">
            {EVENTS_FAQS.map((faq) => (
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

        {/* CTA */}
        <section className="border-t border-white/10 py-16 text-center">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Want to host your own session?
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
