/**
 * ─── Fittrybe — Next.js Config ────────────────────────────────────────────────
 *
 * SEO FIXES:
 *  1. Added Supabase storage hostname to remotePatterns so cover images
 *     can be served via Next.js image optimisation (and not blocked)
 *  2. Added X-Robots-Tag header to /api/* routes to prevent indexing of
 *     API endpoints (good hygiene, prevents crawl budget waste)
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  // ── Image Optimisation ────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      // ── Supabase Storage (cover images uploaded via admin) ────────────────
      // Replace YOUR_PROJECT_REF with your actual Supabase project ref
      // e.g. "abcdefghijklmnop.supabase.co"
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // ── If you later use a custom CDN or Cloudinary, add it here ─────────
      // { protocol: "https", hostname: "cdn.fittrybe.co.uk" },
    ],
  },

  // ── Security & SEO Headers ────────────────────────────────────────────────────
  async headers() {
    return [
      // ── All routes ──────────────────────────────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },

      // ── Static assets ────────────────────────────────────────────────────────
      {
        source: "/(.*)\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // ── Next.js static chunks ────────────────────────────────────────────────
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // ── OG image API — cache at edge for social crawlers ─────────────────────
      // 24h cache is long enough for WhatsApp/Facebook to store the preview;
      // revalidate in the background so stale previews refresh over time.
      {
        source: "/api/og(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
          { key: "Content-Type", value: "image/png" },
        ],
      },

      // ── Other API routes — no indexing ───────────────────────────────────────
      {
        source: "/api/((?!og).*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },

      // ── Sitemap + robots ─────────────────────────────────────────────────────
      {
        source: "/(sitemap.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
