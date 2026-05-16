/**
 * /sports/[sport] — Per-sport programmatic SEO landing page.
 *
 * Targets keyword clusters like "football near me", "find badminton game",
 * "running group near me". Editorial copy + FAQ schema + cross-link to
 * filtered /events?sport=… funnels organic traffic into the conversion path.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSportSlugs, getSportBySlug } from "@/lib/sports";
import { Wordmark } from "@/components/brand/Wordmark";
import { getUpcomingEvents } from "@/lib/events";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import EventCard from "@/components/EventCard";
import {
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildGraphSchema,
  buildWebPageSchema,
} from "@/lib/structured-data";

export const revalidate = 600; // refresh every 10 min — sessions move fast

export async function generateStaticParams() {
  return getAllSportSlugs().map((sport) => ({ sport }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const content = getSportBySlug(sport);
  if (!content) return { title: "Sport Not Found" };

  const canonicalUrl = buildCanonicalUrl(`/sports/${content.slug}`);
  const ogImage = `${seoConfig.siteUrl}/api/og?title=${encodeURIComponent(
    content.headline
  )}&description=${encodeURIComponent(content.tagline)}`;

  return {
    title: `${content.headline} | Fittrybe`,
    description: content.metaDescription,
    keywords: content.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.siteLocale,
      title: content.headline,
      description: content.metaDescription,
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: content.headline,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      title: content.headline,
      description: content.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function SportLandingPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;
  const content = getSportBySlug(sport);
  if (!content) notFound();

  const canonicalUrl = buildCanonicalUrl(`/sports/${content.slug}`);

  // Pull live sessions for this sport so the page never feels empty.
  const allEvents = await getUpcomingEvents();
  const sportEvents = allEvents
    .filter((e) => e.sportId === content.slug)
    .slice(0, 6);

  const pageJsonLd = buildGraphSchema([
    buildWebPageSchema({
      url: canonicalUrl,
      title: content.headline,
      description: content.metaDescription,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Sports", url: buildCanonicalUrl("/sports") },
        { name: content.name, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Sports", url: buildCanonicalUrl("/sports") },
      { name: content.name, url: canonicalUrl },
    ]),
    buildFAQSchema(content.faqs),
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
              href="/sports"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] hidden sm:block"
            >
              All sports
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
            {content.emoji}
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
            {content.name} on Fittrybe
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
            {content.headline}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-[family-name:var(--font-inter-tight)] mb-8">
            {content.intro}
          </p>
          <Link
            href={`/session/${content.slug}`}
            className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide"
          >
            See Upcoming {content.name} Sessions
          </Link>
        </header>

        {/* Highlights / what to expect */}
        <section
          aria-label={`What to expect from ${content.name} on Fittrybe`}
          className="max-w-4xl mx-auto px-6 py-12"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            What to expect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.highlights.map((h) => (
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

        {/* Live sessions for this sport (or empty-state CTA) */}
        <section
          aria-label={`Live ${content.name} sessions`}
          className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
        >
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white">
              Live {content.name} sessions
            </h2>
            <Link
              href={`/session/${content.slug}`}
              className="text-sm text-[#B6FF00] hover:text-white transition-colors font-[family-name:var(--font-inter-tight)] uppercase tracking-wider font-bold"
            >
              View all →
            </Link>
          </div>

          {sportEvents.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-white/60 mb-6 font-[family-name:var(--font-inter-tight)]">
                No live {content.name.toLowerCase()} sessions in your area
                right now. Join the waitlist and get notified the moment one
                drops.
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
              {sportEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* FAQ — visible content matching FAQPage schema */}
        <section
          aria-label={`Frequently asked questions about ${content.name} on Fittrybe`}
          className="max-w-3xl mx-auto px-6 py-16 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-8 text-center">
            {content.name} FAQ
          </h2>
          <dl className="space-y-6">
            {content.faqs.map((faq) => (
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

        {/* Internal-link block to other sports — boosts hub authority */}
        <section
          aria-label="Other sports on Fittrybe"
          className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10"
        >
          <h2 className="font-[family-name:var(--font-anton)] text-2xl font-bold uppercase tracking-tight text-white mb-6 text-center">
            Other sports
          </h2>
          <ul className="flex flex-wrap justify-center gap-3">
            {getAllSportSlugs()
              .filter((s) => s !== content.slug)
              .map((slug) => {
                const other = getSportBySlug(slug)!;
                return (
                  <li key={slug}>
                    <Link
                      href={`/sports/${slug}`}
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
            Ready to play {content.name.toLowerCase()}?
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
