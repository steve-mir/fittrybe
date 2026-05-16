/**
 * /session/[slug] — Unified entry point
 *
 *   /session/running, /session/football, /session/tennis…  → SEO sport landing
 *   /session/<uuid>                                         → mobile deep-link
 *
 * Why one route:
 *   - Lets sport-specific URLs ("/session/running") rank for grassroots queries
 *     while preserving every existing /session/<uuid> deep-link shared in the
 *     wild (group chats, social posts) — those keep redirecting into the app.
 *
 * SEO surface for sport landings:
 *   - Indexable, canonical, FAQ + ItemList + CollectionPage schema
 *   - Lists live sessions (server-rendered, revalidated every 60s)
 *   - Internal links to /events, /sports/<slug>, /events/<sport>/in/<city>
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Wordmark } from "@/components/brand/Wordmark";
import EventCard from "@/components/EventCard";
import { getSportBySlug, getAllSportSlugs } from "@/lib/sports";
import { getUpcomingEvents } from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildGraphSchema,
  buildItemListSchema,
  type ItemListEvent,
} from "@/lib/structured-data";

// Refresh live session counts every 60s without a full rebuild
export const revalidate = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Static params: prerender every known sport slug ─────────────────────────

export function generateStaticParams() {
  return getAllSportSlugs().map((slug) => ({ slug }));
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // UUID branch: noindex bridge page, canonical points to /events/[id]
  if (UUID_RE.test(slug)) {
    const canonical = buildCanonicalUrl(`/events/${encodeURIComponent(slug)}`);
    return {
      title: "Opening Fittrybe…",
      description: "Opening this session in the Fittrybe app.",
      robots: {
        index: false,
        follow: true,
        nocache: true,
        googleBot: { index: false, follow: true },
      },
      alternates: { canonical },
    };
  }

  const sport = getSportBySlug(slug);
  if (!sport) return { title: "Session Not Found | Fittrybe" };

  const canonicalUrl = buildCanonicalUrl(`/session/${sport.slug}`);
  const title = `${sport.name} Sessions Near You | Fittrybe`;
  const description = sport.metaDescription;
  const ogImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    sport.headline
  )}&description=${encodeURIComponent(sport.tagline)}`;

  return {
    title,
    description,
    keywords: sport.keywords,
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
          alt: sport.headline,
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SessionSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // UUID branch → native deep-link bridge
  if (UUID_RE.test(slug)) {
    return <DeepLinkBridge id={slug} />;
  }

  const sport = getSportBySlug(slug);
  if (!sport) notFound();

  const canonicalUrl = buildCanonicalUrl(`/session/${sport.slug}`);
  const allEvents = await getUpcomingEvents();
  const sportEvents = allEvents.filter((e) => e.sportId === sport.slug);

  // Top areas with sessions for this sport — feeds the "browse by city" block
  const cityCounts = new Map<string, { name: string; count: number }>();
  for (const e of sportEvents) {
    const name = (e.locationArea ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = cityCounts.get(key);
    if (existing) existing.count += 1;
    else cityCounts.set(key, { name, count: 1 });
  }
  const cities = Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const itemListEvents: ItemListEvent[] = sportEvents.slice(0, 30).map((e) => ({
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

  const collectionName = `${sport.name} Sessions on Fittrybe`;
  const collectionDescription = sport.metaDescription;
  const breadcrumb = [
    { name: "Home", url: seoConfig.siteUrl },
    { name: "Sessions", url: buildCanonicalUrl("/events") },
    { name: sport.name, url: canonicalUrl },
  ];

  const pageJsonLd = buildGraphSchema(
    [
      buildCollectionPageSchema({
        url: canonicalUrl,
        name: collectionName,
        description: collectionDescription,
        numberOfItems: sportEvents.length,
        breadcrumb,
      }),
      buildBreadcrumbSchema(breadcrumb),
      buildFAQSchema(sport.faqs),
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

  const otherSports = getAllSportSlugs().filter((s) => s !== sport.slug);

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
              href={`/sports/${sport.slug}`}
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              About {sport.name.toLowerCase()}
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
            {sport.emoji}
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            Live {sport.name} Sessions
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            {sport.headline}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)] mb-8">
            {sport.intro}
          </p>
        </header>

        <section
          aria-label={`Upcoming ${sport.name} sessions`}
          className="max-w-6xl mx-auto px-6 pb-12"
        >
          {sportEvents.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-white/60 mb-6 font-[family-name:var(--font-inter-tight)]">
                No upcoming {sport.name.toLowerCase()} sessions right now.
                Join the waitlist and get notified the moment one drops.
              </p>
              <Link
                href="/waitlist"
                className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] uppercase tracking-wide"
              >
                Get notified
              </Link>
            </div>
          ) : (
            <>
              <p className="text-white/40 text-sm font-[family-name:var(--font-inter-tight)] mb-6">
                {sportEvents.length} {sport.name.toLowerCase()} session
                {sportEvents.length !== 1 ? "s" : ""} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sportEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </section>

        {cities.length > 0 && (
          <section
            aria-label={`${sport.name} sessions by city`}
            className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
          >
            <h2 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl font-bold uppercase tracking-tight text-white mb-6 text-center">
              {sport.name} sessions by city
            </h2>
            <ul className="flex flex-wrap justify-center gap-3">
              {cities.map((city) => {
                const citySlug = city.name
                  .toLowerCase()
                  .replace(/&/g, "and")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                return (
                  <li key={citySlug}>
                    <Link
                      href={`/events/${sport.slug}/in/${citySlug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                    >
                      {city.name}
                      <span className="text-xs text-white/40">{city.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section
          aria-label={`What to expect from ${sport.name} on Fittrybe`}
          className="max-w-4xl mx-auto px-6 py-12 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            What to expect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sport.highlights.map((h) => (
              <div
                key={h.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="font-[family-name:var(--font-anton)] text-lg font-bold uppercase tracking-tight text-[#B6FF00] mb-2">
                  {h.title}
                </h3>
                <p className="text-white/70 text-sm font-[family-name:var(--font-inter-tight)] leading-relaxed">
                  {h.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label={`Frequently asked questions about ${sport.name}`}
          className="max-w-3xl mx-auto px-6 py-16 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            {sport.name} FAQ
          </h2>
          <dl className="space-y-6">
            {sport.faqs.map((faq) => (
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

        <section
          aria-label="Other sports on Fittrybe"
          className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-6 text-center">
            Other sports
          </h2>
          <ul className="flex flex-wrap justify-center gap-3">
            {otherSports.map((s) => {
              const other = getSportBySlug(s)!;
              return (
                <li key={s}>
                  <Link
                    href={`/session/${s}`}
                    className="inline-block text-sm font-medium px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 text-white/70 hover:text-white transition-all font-[family-name:var(--font-inter-tight)]"
                  >
                    <span aria-hidden="true">{other.emoji}</span> {other.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-white/10 py-16 text-center px-6">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Ready to play {sport.name.toLowerCase()}?
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
          >
            Join Fittrybe — Find Your Game
          </Link>
        </section>
      </main>
    </>
  );
}

// ─── Deep-link bridge (unchanged behaviour from former /session/[id]) ────────

function DeepLinkBridge({ id }: { id: string }) {
  const safeId = encodeURIComponent(id);
  const fallbackUrl = `https://fittrybe.app/session/${safeId}`;
  const appUrl = `fittrybe://session/${safeId}`;
  const webEquivalent = buildCanonicalUrl(`/events/${safeId}`);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <meta httpEquiv="refresh" content={`2;url=${fallbackUrl}`} />
      <noscript>
        <p>
          Opening Fittrybe… If you are not redirected,{" "}
          <a href={fallbackUrl} style={{ color: "#B6FF00" }}>
            click here
          </a>
          .
        </p>
      </noscript>
      <div>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          Opening Fittrybe…
        </p>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Or{" "}
          <a href={webEquivalent} style={{ color: "#B6FF00" }} rel="canonical">
            view this session on the web
          </a>
          .
        </p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var a=${JSON.stringify(
            appUrl
          )},b=${JSON.stringify(
            fallbackUrl
          )};window.location.href=a;setTimeout(function(){window.location.href=b;},1500);})();`,
        }}
      />
    </main>
  );
}
