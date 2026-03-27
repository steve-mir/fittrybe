/**
 * ─── Fittrybe — Dynamic Sitemap ───────────────────────────────────────────────
 * Accessible at: /sitemap.xml
 */

import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo-config";
import { getAllBlogSlugs } from "@/lib/posts";

const BASE_URL = seoConfig.siteUrl;

export const revalidate = 3600; // Revalidate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

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
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Blog post pages — fetched from Firestore
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllBlogSlugs();
    blogPages = slugs.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Silently skip if Firestore is unreachable during build
  }

  return [...staticPages, ...blogPages];
}
