/**
 * /events/[sport]/in/[city] — Sport + city programmatic landing page.
 *
 * The route segment is named [id] for Next.js compatibility (it sits next
 * to /events/[id]/page.tsx and Next requires matching slug names at the
 * same position), but the value is always validated as a sport slug.
 *
 * Targets long-tail "[sport] near [city]" queries — the highest-intent,
 * lowest-competition slice of grassroots sports search.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import EventCard from "@/components/EventCard";
import {
  citySlugToDisplay,
  getUpcomingEventCities,
  getUpcomingEventsBySportAndCitySlug,
  sportEmoji,
  sportLabel,
} from "@/lib/events";
import { getAllSportSlugs, getSportBySlug } from "@/lib/sports";
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

function buildSportCityFaqs(sportName: string, cityName: string) {
  return [
    {
      question: `Where can I play ${sportName.toLowerCase()} in ${cityName}?`,
      answer: `Fittrybe lists every upcoming ${sportName.toLowerCase()} session in ${cityName}. Each session shows the venue, time, price and remaining spots upfront. Tap any card to view the location and reserve a spot.`,
    },
    {
      question: `How much does ${sportName.toLowerCase()} cost in ${cityName}?`,
      answer: `Most ${sportName.toLowerCase()} sessions in ${cityName} are £3–£10 per player to cover venue costs. The exact price is shown on each session card before you commit.`,
    },
    {
      question: `Can beginners play ${sportName.toLowerCase()} in ${cityName} on Fittrybe?`,
      answer: `Yes — many ${cityName} hosts mark sessions as Beginner or All Levels. Filter by skill level when browsing, and look for sessions tagged Casual or Open if you're new.`,
    },
  ];
}

export async function generateStaticParams() {
  // Cap aggressively: only top sport×city combos are prebuilt; the rest
  // come from ISR. Otherwise we'd build hundreds of pages with no traffic.
  // The dynamic segment is `id` for Next.js routing reasons but holds a
  // sport slug here.
  const cities = await getUpcomingEventCities();
  const sports = getAllSportSlugs();
  const params: Array<{ id: string; city: string }> = [];
  for (const city of cities.slice(0, 10)) {
    for (const sport of sports) {
      params.push({ id: sport, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; city: string }>;
}): Promise<Metadata> {
  const { id: sport, city: slug } = await params;
  const sportContent = getSportBySlug(sport);
  if (!sportContent) {
    return { title: "Sport Not Found", robots: { index: false, follow: false } };
  }

  const cities = await getUpcomingEventCities();
  const cityMatch = cities.find((c) => c.slug === slug);
  const cityName = cityMatch?.name ?? citySlugToDisplay(slug);
  const cityHasSport = cityMatch !== undefined;

  const canonicalUrl = buildCanonicalUrl(`/events/${sport}/in/${slug}`);
  const sportName = sportContent.name;

  const title = `${sportName} in ${cityName} — Find a Game | Fittrybe`;
  const description = `Find live ${sportName.toLowerCase()} sessions in ${cityName} on Fittrybe. ${sportContent.tagline} Reserve your spot in one tap.`;

  const ogImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    `${sportName} in ${cityName}`
  )}&description=${encodeURIComponent(description)}&sport=${sport}`;

  return {
    title,
    description,
    keywords: [
      `${sport} near me ${cityName}`,
      `${sport} in ${cityName}`,
      `${sport} session ${cityName}`,
      `find ${sport} game ${cityName}`,
      `pickup ${sport} ${cityName}`,
      `${sportName.toLowerCase()} club ${cityName}`,
      ...sportContent.keywords,
      "fittrybe",
    ],
    alternates: { canonical: canonicalUrl },
    // Don't index pages with no live sessions and no city evidence —
    // they're thin content. Keep the ones that have data, even if empty.
    robots: !cityHasSport
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

export default async function SportCityPage({
  params,
}: {
  params: Promise<{ id: string; city: string }>;
}) {
  const { id: sport, city: slug } = await params;
  const sportContent = getSportBySlug(sport);
  if (!sportContent) notFound();

  const [events, cities] = await Promise.all([
    getUpcomingEventsBySportAndCitySlug(sport, slug),
    getUpcomingEventCities(),
  ]);

  const cityMatch = cities.find((c) => c.slug === slug);
  if (!cityMatch && events.length === 0) notFound();
  const cityName = cityMatch?.name ?? citySlugToDisplay(slug);

  const canonicalUrl = buildCanonicalUrl(`/events/${sport}/in/${slug}`);
  const sportName = sportContent.name;
  const cityHref = `/events/in/${slug}`;
  const sportHref = `/sports/${sport}`;

  const collectionName = `${sportName} Sessions in ${cityName}`;
  const collectionDescription = `Live grassroots ${sportName.toLowerCase()} sessions in ${cityName}. ${sportContent.tagline}`;
  const faqs = buildSportCityFaqs(sportName, cityName);

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
          { name: cityName, url: buildCanonicalUrl(cityHref) },
          { name: sportName, url: canonicalUrl },
        ],
      }),
      buildBreadcrumbSchema([
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Events", url: buildCanonicalUrl("/events") },
        { name: cityName, url: buildCanonicalUrl(cityHref) },
        { name: sportName, url: canonicalUrl },
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
              href={cityHref}
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              All sports in {cityName}
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
          <div className="text-6xl mb-4" aria-hidden="true">
            {sportEmoji(sport)}
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            {sportName} · {cityName}
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            {sportName} in {cityName}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)] mb-8">
            {events.length === 0
              ? `No live ${sportName.toLowerCase()} sessions in ${cityName} right now. Join the waitlist and we'll ping you the moment one drops.`
              : `${events.length} upcoming ${sportName.toLowerCase()} session${events.length === 1 ? "" : "s"} in ${cityName}. ${sportContent.tagline}`}
          </p>
        </header>

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
            <li>
              <Link href={cityHref} className="hover:text-[#B6FF00] transition-colors">
                {cityName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white/70">{sportName}</li>
          </ol>
        </nav>

        {/* What to expect — pulled from sport content library */}
        <section
          aria-label={`What to expect from ${sportName} in ${cityName}`}
          className="max-w-4xl mx-auto px-6 py-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sportContent.highlights.map((h) => (
              <div
                key={h.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h2 className="font-[family-name:var(--font-anton)] text-lg font-bold uppercase tracking-tight text-[#B6FF00] mb-2">
                  {h.title}
                </h2>
                <p className="text-white/70 text-sm font-[family-name:var(--font-inter-tight)] leading-relaxed">
                  {h.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Events grid */}
        <section
          aria-label={`Live ${sportName} sessions in ${cityName}`}
          className="max-w-6xl mx-auto px-6 pb-20"
        >
          {events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-[family-name:var(--font-inter-tight)] mb-6">
                No live {sportName.toLowerCase()} sessions in {cityName} right now.
              </p>
              <Link
                href={sportHref}
                className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] uppercase tracking-wide"
              >
                See {sportName} elsewhere
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
          aria-label={`${sportName} in ${cityName} FAQ`}
          className="max-w-3xl mx-auto px-6 py-16 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            {sportName} in {cityName} FAQ
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

        {/* Cross-link block — broaden internal linking footprint */}
        <section
          aria-label="Related sport and city pages"
          className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-[family-name:var(--font-anton)] text-xl font-bold uppercase tracking-tight text-white mb-4">
                Other sports in {cityName}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {getAllSportSlugs()
                  .filter((s) => s !== sport)
                  .map((s) => (
                    <li key={s}>
                      <Link
                        href={`/events/${s}/in/${slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                      >
                        {sportLabel(s)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-anton)] text-xl font-bold uppercase tracking-tight text-white mb-4">
                {sportName} in other cities
              </h2>
              <ul className="flex flex-wrap gap-2">
                {cities
                  .filter((c) => c.slug !== slug)
                  .slice(0, 12)
                  .map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/events/${sport}/in/${c.slug}`}
                        className="inline-block text-sm font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-16 text-center px-6">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Want to host a {sportName.toLowerCase()} session in {cityName}?
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
