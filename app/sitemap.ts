/**
 * ─── Fittrybe — Dynamic Sitemap ───────────────────────────────────────────────
 *
 * Accessible at: /sitemap.xml
 *
 * Includes static pages + programmatic SEO pages when they exist.
 * All entries include changeFrequency and priority signals to help
 * crawlers prioritise correctly.
 */

import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo-config";

const BASE_URL = seoConfig.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/waitlist`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  // ── Programmatic SEO pages ──────────────────────────────────────────────────
  // These sections are architectural placeholders.
  // When you create /blog/[slug], /guides/[topic], /resources/[tool],
  // fetch their slugs here (e.g. from a CMS or filesystem) and spread them in.

  // Example pattern — uncomment and adapt when pages exist:
  //
  // const blogSlugs = await getBlogSlugs(); // your data source
  // const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
  //   url: `${BASE_URL}/blog/${slug}`,
  //   lastModified: now,
  //   changeFrequency: "weekly" as const,
  //   priority: 0.7,
  // }));
  //
  // const guideTopics = await getGuideTopics();
  // const guidePages: MetadataRoute.Sitemap = guideTopics.map((topic) => ({
  //   url: `${BASE_URL}/guides/${topic}`,
  //   lastModified: now,
  //   changeFrequency: "monthly" as const,
  //   priority: 0.6,
  // }));

  // ── Future section pages (add as they're built) ──────────────────────────────
  const upcomingPages: MetadataRoute.Sitemap = [
    // Uncomment each entry as the page is created:
    // { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    // { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    // { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...staticPages,
    ...upcomingPages,
    // ...blogPages,
    // ...guidePages,
  ];
}
