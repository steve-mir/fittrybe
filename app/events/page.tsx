import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import EventCard from "@/components/EventCard";
import Link from "next/link";

const eventsOGImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
  "Upcoming Sports Sessions"
)}&description=${encodeURIComponent(
  "Find and join grassroots sports sessions near you. Football, basketball, cycling and more."
)}`;

export const metadata: Metadata = {
  title: "Events — Upcoming Sports Sessions Near You | Fittrybe",
  description:
    "Browse upcoming grassroots sports sessions on Fittrybe. Find football, basketball, cycling, badminton and more near you. Reserve your spot in one tap.",
  alternates: {
    canonical: buildCanonicalUrl("/events"),
  },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/events"),
    siteName: seoConfig.siteName,
    locale: seoConfig.siteLocale,
    title: "Upcoming Sports Sessions | Fittrybe",
    description:
      "Find real grassroots sports sessions near you. Football, basketball, cycling and more.",
    images: [
      {
        url: eventsOGImage,
        secureUrl: eventsOGImage,
        width: 1200,
        height: 630,
        alt: "Upcoming Sports Sessions — Fittrybe",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    title: "Upcoming Sports Sessions | Fittrybe",
    description:
      "Find real grassroots sports sessions near you.",
    images: [eventsOGImage],
  },
};

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

export default async function EventsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const allEvents = await getUpcomingEvents();

  const filteredEvents =
    sport && sport !== "all"
      ? allEvents.filter((e) => e.sportId === sport)
      : allEvents;

  return (
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
        <p className="text-white/60 text-lg max-w-xl mx-auto font-[family-name:var(--font-dm-sans)]">
          Real grassroots sessions happening near you. Reserve your spot and meet your tribe.
        </p>
      </section>

      {/* Sport filters */}
      <section className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {SPORT_FILTERS.map((filter) => {
            const isActive = (!sport && filter.id === "all") || sport === filter.id;
            return (
              <Link
                key={filter.id}
                href={filter.id === "all" ? "/events" : `/events?sport=${filter.id}`}
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
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg font-[family-name:var(--font-dm-sans)] mb-6">
              {sport && sport !== "all"
                ? `No upcoming ${sport} sessions right now. Check back soon!`
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
              {filteredEvents.length} session{filteredEvents.length !== 1 ? "s" : ""} available
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
  );
}