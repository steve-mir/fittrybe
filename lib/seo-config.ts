/**
 * ─── Fittrybe — Centralized SEO Configuration ────────────────────────────────
 *
 * Single source of truth for all SEO metadata, structured data,
 * social links, and site-wide config. Import this wherever metadata
 * or schema markup is generated to keep everything in sync.
 *
 * SEO FIXES:
 *  1. siteUrl uses NEXT_PUBLIC_SITE_URL env var so it works on both
 *     fittrybe.co.uk (production) and Vercel preview URLs — this is the
 *     most common cause of broken OG previews (wrong domain in og:url)
 *  2. defaultOGImage.url is now absolute and derived from siteUrl
 *  3. buildOGImageUrl always returns an absolute URL
 */

// ─── Core Site Identity ───────────────────────────────────────────────────────

// Read from env so Vercel preview deployments also get correct canonical URLs.
// Set NEXT_PUBLIC_SITE_URL=https://fittrybe.co.uk in your Vercel project settings.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://fittrybe.co.uk";

export const seoConfig = {
  // Identity
  siteName: "Fittrybe",
  siteUrl: SITE_URL,
  siteLocale: "en_GB",
  siteLanguage: "en",

  // Branding
  themeColor: "#B6FF00",
  backgroundColor: "#050505",

  // Default metadata
  titleTemplate: "%s | Fittrybe",
  defaultTitle: "Fittrybe — Find Your Game. Play With Your City.",
  shortTitle: "Fittrybe",

  description:
    "Fittrybe is a location-based social sports app. Discover real sports sessions near you, reserve your spot in one tap, and meet your tribe. Football, basketball, badminton, tennis and more.",

  shortDescription:
    "Discover real sports sessions near you. Join a game, meet your tribe, show up and play.",

  keywords: [
    "local sports app",
    "sports sessions near me",
    "find football game",
    "find basketball game",
    "social sports app",
    "sports community app",
    "join a sports team",
    "local sports events",
    "fittrybe",
    "play sport locally",
    "sports near me",
    "casual sports",
    "badminton near me",
    "tennis near me",
    "running group near me",
    "sports meetup app",
    "find people to play sport with",
    "local basketball court",
    "five-a-side football app",
    "sports booking app",
  ],

  // Author / Publisher
  author: {
    name: "Fittrybe",
    url: SITE_URL,
    email: "hello@fittrybe.co.uk",
  },

  creator: "Fittrybe",
  publisher: "Fittrybe",

  // Category
  category: "Sports & Recreation",
  applicationName: "Fittrybe",

  // ─── Image Assets ───────────────────────────────────────────────────────────
  // IMPORTANT: These must be absolute URLs — social crawlers cannot resolve
  // relative paths. We derive them from SITE_URL for correctness.
  get defaultOGImage() {
    return {
      url: `${SITE_URL}/api/og?title=${encodeURIComponent("Find Your Game. Play With Your City.")}`,
      width: 1200,
      height: 630,
      alt: "Fittrybe — Find Your Game. Play With Your City.",
      type: "image/png",
    };
  },

  logo: {
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },

  favicon: "/favicon.ico",

  // ─── Social Handles ─────────────────────────────────────────────────────────
  twitterHandle: "@fittrybe",

  socialLinks: {
    twitter: "https://twitter.com/fittrybe",
    instagram: "https://instagram.com/fittrybe",
    tiktok: "https://tiktok.com/@fittrybe",
  },

  // ─── App Store Links ────────────────────────────────────────────────────────
  appLinks: {
    ios: "https://apps.apple.com/app/fittrybe",
    android: "https://play.google.com/store/apps/details?id=com.fittrybe",
  },

  // ─── Verification Codes ─────────────────────────────────────────────────────
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    bing: process.env.NEXT_PUBLIC_BING_SITE_AUTH ?? "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
  },

  // ─── Analytics ──────────────────────────────────────────────────────────────
  analytics: {
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  },

  // ─── Robots Defaults ────────────────────────────────────────────────────────
  robotsDefault: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1 as const,
      "max-image-preview": "large" as const,
      "max-snippet": -1 as const,
    },
  },

  // ─── Pages ──────────────────────────────────────────────────────────────────
  get pages() {
    return {
      home: {
        path: "/",
        url: SITE_URL,
        title: "Fittrybe — Find Your Game. Play With Your City.",
        description:
          "Fittrybe is a location-based social sports app. Discover real sports sessions near you, reserve your spot in one tap, and meet your tribe. Football, basketball, badminton, tennis and more.",
      },
      waitlist: {
        path: "/waitlist",
        url: `${SITE_URL}/waitlist`,
        title: "Join the Fittrybe Waitlist — Get Early Access",
        description:
          "Be the first to play when Fittrybe launches in your city. Join the waitlist now and get early access to the social sports app that connects real players near you.",
      },
    };
  },
} as const;

// ─── Helper: build full canonical URL ─────────────────────────────────────────
export function buildCanonicalUrl(path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalised}`;
}

// ─── Helper: build OG image URL — ALWAYS returns an absolute URL ──────────────
// This is critical: relative URLs in og:image are NOT resolved by most
// social crawlers (WhatsApp, Facebook, Telegram). Always absolute.
export function buildOGImageUrl(params?: {
  title?: string;
  description?: string;
  path?: string;
}): string {
  if (!params) return seoConfig.defaultOGImage.url;
  const base = `${SITE_URL}/api/og`;
  const query = new URLSearchParams();
  if (params.title) query.set("title", params.title);
  if (params.description) query.set("description", params.description);
  if (params.path) query.set("path", params.path);
  return `${base}?${query.toString()}`;
}
