/**
 * ─── Fittrybe — Waitlist Page ─────────────────────────────────────────────────
 *
 * SEO improvements:
 *  • generateMetadata() with conversion-focused description + canonical
 *  • WebPage + BreadcrumbList JSON-LD schemas
 *  • noindex NOT set — this page should be indexed (conversion funnel)
 *  • Semantic <main>, <section>, form <label> accessibility
 */

import type { Metadata } from "next";
import { seoConfig, buildOGImageUrl } from "@/lib/seo-config";
import { buildWebPageSchema, buildBreadcrumbSchema, buildGraphSchema } from "@/lib/structured-data";
import WaitlistPageClient from "@/components/WaitlistPageClient";

// ─── Page-level Metadata ──────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: seoConfig.pages.waitlist.title,
  description: seoConfig.pages.waitlist.description,
  alternates: {
    canonical: seoConfig.pages.waitlist.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: seoConfig.pages.waitlist.title,
    description: seoConfig.pages.waitlist.description,
    url: seoConfig.pages.waitlist.url,
    images: [
      {
        url: buildOGImageUrl({
          title: "Join the Fittrybe Waitlist",
          description: "Get early access to the social sports app launching in your city.",
        }),
        width: 1200,
        height: 630,
        alt: "Join the Fittrybe Waitlist — Get Early Access",
      },
    ],
  },
  twitter: {
    title: seoConfig.pages.waitlist.title,
    description: seoConfig.pages.waitlist.description,
    images: [buildOGImageUrl({ title: "Join the Fittrybe Waitlist" })],
  },
};

// ─── Page-level JSON-LD ───────────────────────────────────────────────────────
const pageJsonLd = buildGraphSchema([
  buildWebPageSchema({
    url: seoConfig.pages.waitlist.url,
    title: seoConfig.pages.waitlist.title,
    description: seoConfig.pages.waitlist.description,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: [
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Join Waitlist", url: seoConfig.pages.waitlist.url },
    ],
  }),
  buildBreadcrumbSchema([
    { name: "Home", url: seoConfig.siteUrl },
    { name: "Join Waitlist", url: seoConfig.pages.waitlist.url },
  ]),
]);

export default function WaitlistPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: pageJsonLd }} />
      <WaitlistPageClient />
    </>
  );
}
