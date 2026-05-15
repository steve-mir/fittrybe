/**
 * /venues — Partner venue index. Hub for crawlers and humans to find every
 * curated venue page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { getActiveVenues } from "@/lib/venues";
import { sportLabel } from "@/lib/events";
import { buildCanonicalUrl, seoConfig } from "@/lib/seo-config";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildGraphSchema,
} from "@/lib/structured-data";

export const revalidate = 1800;

const PAGE_TITLE = "Sports Venues on Fittrybe — Pitches, Courts & Studios";
const PAGE_DESCRIPTION =
  "Browse Fittrybe partner venues across the UK. Find football pitches, basketball courts, tennis clubs and more, with live session availability.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: buildCanonicalUrl("/venues") },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/venues"),
    siteName: seoConfig.siteName,
    locale: seoConfig.siteLocale,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
          "Sports Venues on Fittrybe"
        )}&description=${encodeURIComponent(PAGE_DESCRIPTION)}`,
        width: 1200,
        height: 630,
        alt: PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function VenuesIndexPage() {
  const venues = await getActiveVenues();
  const canonicalUrl = buildCanonicalUrl("/venues");

  const pageJsonLd = buildGraphSchema([
    buildCollectionPageSchema({
      url: canonicalUrl,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      numberOfItems: venues.length,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Venues", url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Venues", url: canonicalUrl },
    ]),
  ]);

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

        <header className="max-w-4xl mx-auto px-6 py-16 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            Partner Venues
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            Find Your Venue.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)]">
            Pitches, courts, studios and clubs that partner with Fittrybe.
            Tap any venue to see live sessions and reserve a spot.
          </p>
        </header>

        <section
          aria-label="All Fittrybe venues"
          className="max-w-6xl mx-auto px-6 pb-20"
        >
          {venues.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-lg font-[family-name:var(--font-inter-tight)] mb-6">
                No partner venues listed yet — check back soon.
              </p>
              <Link
                href="/events"
                className="inline-block px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] uppercase tracking-wide"
              >
                Browse sessions
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <li key={venue.slug}>
                  <Link
                    href={`/venues/${venue.slug}`}
                    className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#B6FF00]/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    {venue.photoUrl && (
                      <div className="aspect-[16/9] bg-white/5 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={venue.photoUrl}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6 font-[family-name:var(--font-inter-tight)]">
                      <h2 className="text-lg font-bold text-white mb-1 group-hover:text-[#B6FF00] transition-colors font-[family-name:var(--font-anton)] uppercase tracking-tight">
                        {venue.name}
                      </h2>
                      {venue.city && (
                        <p className="text-sm text-white/50 mb-3">{venue.city}</p>
                      )}
                      {venue.sportTypes.length > 0 && (
                        <p className="text-xs text-white/40 line-clamp-1">
                          {venue.sportTypes.map(sportLabel).join(" · ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
