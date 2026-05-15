/**
 * ─── Fittrybe — Dynamic Sitemap ───────────────────────────────────────────────
 * Accessible at: /sitemap.xml
 *
 * Includes:
 *   • Static pages
 *   • Per-sport hubs                       /sports/[sport]
 *   • Per-city event lists                 /events/in/[city]
 *   • Per-sport-per-city pages             /events/[sport]/in/[city]
 *   • Partner venue pages                  /venues/[slug]
 *   • Live event detail pages              /events/[id]   (upcoming only)
 *   • Blog posts                           /blog/[slug]
 *
 * Past and cancelled events are deliberately excluded — they're noindexed at
 * the page level too, but keeping them out of the sitemap saves Google's
 * crawl budget for the URLs we actually want indexed.
 *
 * The whole sitemap is capped under 50k URLs to stay within Google's per-file
 * limit; sportCity combinations are capped to "top cities × all sports".
 */

import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo-config";
import { getPublishedPosts } from "@/lib/posts";
import { getUpcomingEventCities, getUpcomingEvents } from "@/lib/events";
import { getActiveVenues } from "@/lib/venues";
import { getAllSportSlugs } from "@/lib/sports";

const BASE_URL = seoConfig.siteUrl;

export const revalidate = 3600; // hourly

const SPORT_HUBS = [
  "football",
  "basketball",
  "tennis",
  "badminton",
  "running",
  "cycling",
  "swimming",
  "gym",
  "boxing",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/waitlist`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/sports`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/venues`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Per-sport hub pages — high SEO value for "<sport> near me"
  const sportPages: MetadataRoute.Sitemap = SPORT_HUBS.map((sport) => ({
    url: `${BASE_URL}/sports/${sport}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // City + sport×city programmatic pages — fed by live area data
  let cityPages: MetadataRoute.Sitemap = [];
  const sportCityPages: MetadataRoute.Sitemap = [];
  try {
    const cities = await getUpcomingEventCities();
    cityPages = cities.map((c) => ({
      url: `${BASE_URL}/events/in/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: c.count > 5 ? 0.8 : 0.7,
    }));

    const sports = getAllSportSlugs();
    // Cap to top 20 cities × all sports — anything past that is mostly noise
    const topCities = cities.slice(0, 20);
    for (const city of topCities) {
      for (const sport of sports) {
        sportCityPages.push({
          url: `${BASE_URL}/events/${sport}/in/${city.slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  } catch {
    // Supabase down at build — skip silently rather than fail the build
  }

  // Venue pages — small curated set
  let venuePages: MetadataRoute.Sitemap = [];
  try {
    const venues = await getActiveVenues();
    venuePages = venues.map((v) => ({
      url: `${BASE_URL}/venues/${v.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // ignore
  }

  // Blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();
    blogPages = posts.map((post, index) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: index < 5 ? 0.8 : 0.7,
    }));
  } catch {
    // ignore
  }

  // Event detail pages — UPCOMING ONLY. Past/cancelled events are noindex
  // at the page level; including them here would waste crawl budget.
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await getUpcomingEvents();
    eventPages = events
      .filter((e) => !e.isCancelled)
      .map((event) => ({
        url: `${BASE_URL}/events/${event.id}`,
        lastModified: new Date(event.updatedAt || event.startsAt),
        changeFrequency: "daily" as const,
        priority: event.isFeatured ? 0.9 : 0.7,
      }));
  } catch {
    // ignore
  }

  return [
    ...staticPages,
    ...sportPages,
    ...cityPages,
    ...sportCityPages,
    ...venuePages,
    ...blogPages,
    ...eventPages,
  ];
}
