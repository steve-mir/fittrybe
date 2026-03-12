/**
 * ─── Fittrybe — Landing Page ──────────────────────────────────────────────────
 *
 * SEO additions vs original:
 *  • generateMetadata() with page-specific canonical, OG, Twitter
 *  • WebPage + MobileApplication + FAQ JSON-LD schemas
 *  • Semantic HTML5 structure (<main>, <section>, <article>, <nav>, <footer>)
 *  • ARIA labels on interactive elements
 *  • next/image for all <img> tags with priority on hero
 *  • Descriptive alt text on all images
 *  • H1 → H2 → H3 heading hierarchy for crawlers
 *  • FAQ section (visible + FAQ schema) for AI search engines
 *  • Internal link: Landing → /waitlist with keyword anchor text
 *  • Font CSS moved from @import to next/font CSS variables (CLS fix)
 */

import type { Metadata } from "next";
import { seoConfig, buildOGImageUrl } from "@/lib/seo-config";
import {
  buildWebPageSchema,
  buildAppSchema,
  buildFAQSchema,
  buildGraphSchema,
  LANDING_FAQS,
} from "@/lib/structured-data";
import LandingPageClient from "@/components/LandingPageClient";

// ─── Page-level Metadata ──────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: seoConfig.pages.home.title,
  description: seoConfig.pages.home.description,
  alternates: {
    canonical: seoConfig.pages.home.url,
  },
  openGraph: {
    title: seoConfig.pages.home.title,
    description: seoConfig.pages.home.description,
    url: seoConfig.pages.home.url,
    images: [
      {
        url: buildOGImageUrl({ title: "Find Your Game. Play With Your City.", description: seoConfig.shortDescription }),
        width: 1200,
        height: 630,
        alt: "Fittrybe — Find Your Game. Play With Your City.",
      },
    ],
  },
  twitter: {
    title: seoConfig.pages.home.title,
    description: seoConfig.pages.home.description,
    images: [buildOGImageUrl({ title: "Find Your Game. Play With Your City." })],
  },
};

// ─── Page-level JSON-LD ───────────────────────────────────────────────────────
const pageJsonLd = buildGraphSchema([
  buildWebPageSchema({
    url: seoConfig.pages.home.url,
    title: seoConfig.pages.home.title,
    description: seoConfig.pages.home.description,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  }),
  buildAppSchema(),
  buildFAQSchema(LANDING_FAQS),
]);

// ─── Page (Server Component) ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* Page-specific JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />
      {/* Client component contains all the interactive/animated UI */}
      <LandingPageClient faqs={LANDING_FAQS} />
    </>
  );
}
