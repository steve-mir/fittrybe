/**
 * /sports — Sport hub index page.
 * Programmatic SEO: provides a clean entry point linking to every per-sport
 * page, internally crosslinks to /events and the waitlist, and exposes
 * a CollectionPage schema so search engines crawl the hub efficiently.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SPORTS } from "@/lib/sports";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildWebPageSchema,
} from "@/lib/structured-data";

const PAGE_TITLE = "Sports on Fittrybe — Football, Basketball, Tennis & More";
const PAGE_DESCRIPTION =
  "Browse every sport on Fittrybe. Find football, basketball, tennis, badminton, running and more grassroots sessions near you across the UK.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: buildCanonicalUrl("/sports") },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/sports"),
    siteName: seoConfig.siteName,
    locale: seoConfig.siteLocale,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
          "Find Your Game"
        )}&description=${encodeURIComponent(
          "Football, basketball, tennis, running and more — sports near you."
        )}`,
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

export default function SportsHubPage() {
  const canonicalUrl = buildCanonicalUrl("/sports");

  const collectionJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}/#collection`,
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonicalUrl,
    isPartOf: { "@id": `${seoConfig.siteUrl}/#website` },
    inLanguage: seoConfig.siteLanguage,
    hasPart: SPORTS.map((s) => ({
      "@type": "WebPage",
      url: buildCanonicalUrl(`/sports/${s.slug}`),
      name: s.headline,
      description: s.metaDescription,
    })),
  });

  const pageJsonLd = buildGraphSchema([
    buildWebPageSchema({
      url: canonicalUrl,
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Sports", url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Sports", url: canonicalUrl },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: collectionJsonLd }}
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

        <header className="max-w-6xl mx-auto px-6 py-16 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            Sports Hub
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            Find Your Game.
            <br />
            <span className="text-[#B6FF00]">Pick Your Sport.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)]">
            From five-a-side football to morning tennis. Every grassroots sport
            on Fittrybe, with live sessions across the UK.
          </p>
        </header>

        <section
          aria-label="All sports on Fittrybe"
          className="max-w-6xl mx-auto px-6 pb-20"
        >
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SPORTS.map((sport) => (
              <li key={sport.slug}>
                <Link
                  href={`/sports/${sport.slug}`}
                  className="group block bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B6FF00]/40 rounded-2xl p-6 transition-all"
                  aria-label={`${sport.name} sessions on Fittrybe`}
                >
                  <div className="text-4xl mb-3" aria-hidden="true">
                    {sport.emoji}
                  </div>
                  <h2 className="font-[family-name:var(--font-anton)] text-xl font-bold uppercase tracking-tight text-white mb-1 group-hover:text-[#B6FF00] transition-colors">
                    {sport.name}
                  </h2>
                  <p className="text-xs text-white/50 font-[family-name:var(--font-inter-tight)] line-clamp-2">
                    {sport.tagline}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-white/10 py-16 text-center px-6">
          <p className="text-white/60 mb-4 font-[family-name:var(--font-inter-tight)]">
            Don&apos;t see your sport? More are added every month.
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
          >
            Join Fittrybe — Request a Sport
          </Link>
        </section>
      </main>
    </>
  );
}
