/**
 * ─── Fittrybe — robots.txt ────────────────────────────────────────────────────
 *
 * Accessible at: /robots.txt
 *
 * Strategy:
 *  • Allow all compliant crawlers to index all public pages
 *  • Reference sitemap for efficient crawl budget allocation
 *  • Block access to API routes, private dirs, and Next.js internals
 *
 * AI search engines (GPTBot, PerplexityBot, Gemini) are explicitly allowed —
 * this is a deliberate decision to maximise AI-source discoverability.
 * Remove any entry below if your policy changes.
 */

import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Main rule: allow all well-behaved crawlers ──────────────────────────
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",          // Keep API routes out of index
          "/_next/",        // Next.js internals
          "/static/",       // Static build artifacts
          "/*.json$",       // Config/data files
          "/admin/",        // Future admin panel
        ],
      },

      // ── Explicitly allow Google ─────────────────────────────────────────────
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/public/images/", "/og/"],
      },
      {
        userAgent: "Googlebot-Video",
        allow: ["/public/videos/"],
      },

      // ── Bing ────────────────────────────────────────────────────────────────
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: ["/api/", "/_next/"],
      },

      // ── AI Search Engines — explicitly welcome ───────────────────────────────
      // GPTBot (ChatGPT / OpenAI browsing)
      {
        userAgent: "GPTBot",
        allow: ["/"],
        disallow: ["/api/"],
      },
      // PerplexityBot
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
        disallow: ["/api/"],
      },
      // Google-Extended (Gemini training)
      {
        userAgent: "Google-Extended",
        allow: ["/"],
      },
      // Anthropic ClaudeBot
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
        disallow: ["/api/"],
      },
      // CCBot (Common Crawl — used by many AI training datasets)
      {
        userAgent: "CCBot",
        allow: ["/"],
        disallow: ["/api/"],
      },
    ],

    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,

    // Optional: host directive (used by Yandex)
    host: seoConfig.siteUrl,
  };
}
