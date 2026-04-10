import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import { buildItemListSchema } from "@/lib/structured-data";
import EventCard from "@/components/EventCard";
import Link from "next/link";

// Revalidate every 60 seconds so new sessions appear without a full rebuild
export const revalidate = 60;

const SPORT_FILTERS = [
  { id: "all", label: "All Sports" },
  { id: "football", label: "⚽ Football" },
  { id: "basketball", label: "🏀 Basketball" },
  { id: "cycling", label: "🚴 Cycling" },
  { id: "running", label: "🏃 Running" },
  { id: "badminton", label: "🏸 Badminton" },
  { id: "tennis", label: "🎾 Tennis" },
  { id: "gym", label: "🏋️ Gym" },
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

  const canonicalUrl = buildCanonicalUrl("/events");

  const eventsOGImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    activeSport ? `${capitalise(activeSport)} Sessions Near You` : "Upcoming Sports Sessions"
  )}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    // All sport filter URLs point canonical back to /events (Option A from brief)
    alternates: {
      canonical: canonicalUrl,
    },
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
  const allEvents = await getUpcomingEvents();

  const activeSport = sport && sport !== "all" ? sport : null;

  const filteredEvents = activeSport
    ? allEvents.filter((e) => e.sportId === activeSport)
    : allEvents;

  const isEmpty = filteredEvents.length === 0;

  // ItemList schema — only emit when we have results
  const itemListJsonLd =
    !isEmpty
      ? JSON.stringify(buildItemListSchema(filteredEvents, seoConfig.siteUrl))
      : null;

  return (
    <>
      {/* Noindex empty filter result pages */}
      {isEmpty && activeSport && (
        <meta name="robots" content="noindex, follow" />
      )}

      {/* ItemList structured data */}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
        />
      )}

      <main className="min-h-screen bg-[#050505] text-white">
        {/* Nav */}
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/"
            className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black tracking-tight text-[#B6FF00]"
          >
            FITTRYBE
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-dm-sans)] hidden sm:block"
            >
              Blog
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-medium px-4 py-2 rounded-full bg-[#B6FF00] text-black hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-dm-sans)]"
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
          <h1 className="font-[family-name:var(--font-barlow-condensed)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            Find Your Game.
            <br />
            <span className="text-[#B6FF00]">Show Up and Play.</span>
          </h1>
          {/* Location signal — geographic anchor text for local SEO */}
          <p className="text-white/60 text-lg max-w-xl mx-auto font-[family-name:var(--font-dm-sans)]">
            {activeSport
              ? `Grassroots ${activeSport} sessions in Redhill, Surrey and across the UK. Reserve your spot and meet your tribe.`
              : "Grassroots sports sessions in Redhill, Surrey and across the UK. Football, basketball, cycling and more — reserve your spot in one tap."}
          </p>
        </section>

        {/* Sport filters */}
        <section className="max-w-6xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap gap-2 justify-center">
            {SPORT_FILTERS.map((filter) => {
              const isActive =
                (!activeSport && filter.id === "all") ||
                activeSport === filter.id;
              return (
                <Link
                  key={filter.id}
                  href={
                    filter.id === "all" ? "/events" : `/events?sport=${filter.id}`
                  }
                  className={`text-sm font-medium px-4 py-2 rounded-full transition-all font-[family-name:var(--font-dm-sans)] ${
                    isActive
                      ? "bg-[#B6FF00] text-black"
                      : "bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/30"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Events grid */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          {isEmpty ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-[family-name:var(--font-dm-sans)] mb-6">
                {activeSport
                  ? `No upcoming ${activeSport} sessions right now. Check back soon!`
                  : "No upcoming sessions right now. Check back soon!"}
              </p>
              <Link
                href="/waitlist"
                className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wide"
              >
                Get notified when sessions drop
              </Link>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm font-[family-name:var(--font-dm-sans)] mb-6">
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

        {/* CTA */}
        <section className="border-t border-white/10 py-16 text-center">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-dm-sans)]">
            Want to host your own session?
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
          >
            Join Fittrybe — Host for Free
          </Link>
        </section>
      </main>
    </>
  );
}
