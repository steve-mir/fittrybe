/**
 * ─── Fittrybe — Dynamic Sitemap ───────────────────────────────────────────────
 * Accessible at: /sitemap.xml
 *
 * SEO FIXES:
 *  1. Blog posts now use actual post.updatedAt / publishedAt as lastModified
 *     instead of `new Date()` — Google uses this to decide when to re-crawl.
 *     Using `now` on every request makes every post look "freshly modified",
 *     which wastes crawl budget and dilutes trust.
 *  2. Priority values tuned: recent posts get 0.8, older posts slightly less.
 *  3. Blog index changeFrequency is "daily" (posts added frequently).
 */

import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo-config";
import { getPublishedPosts } from "@/lib/posts";

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

  // Blog post pages — fetch full post data to use real lastModified dates
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();

    // Sort by publishedAt descending to bias priority toward newest posts
    blogPages = posts.map((post, index) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      // Use actual post date — not `now` — so Google knows what changed
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: "weekly" as const,
      // Recent posts (top 5) get slightly higher priority
      priority: index < 5 ? 0.8 : 0.7,
    }));
  } catch {
    // Silently skip if Supabase is unreachable during build
  }

  return [...staticPages, ...blogPages];
}
