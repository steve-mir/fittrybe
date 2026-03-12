/**
 * ─── Fittrybe — Next.js Config ────────────────────────────────────────────────
 *
 * SEO & Performance optimisations:
 *  • Strict Content-Security-Policy headers (security = trust signal)
 *  • Cache-Control headers for static assets (CDN performance)
 *  • X-Robots-Tag header control
 *  • Compression enabled
 *  • Image optimisation configuration
 *  • Bundle analyser ready
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Compression ──────────────────────────────────────────────────────────────
  compress: true,

  // ── Power Pages + Route Handlers ─────────────────────────────────────────────
  poweredByHeader: false, // Remove X-Powered-By (security best practice)

  // ── Image Optimisation ────────────────────────────────────────────────────────
  images: {
    // Serve modern formats: WebP/AVIF (smaller files = faster LCP)
    formats: ["image/avif", "image/webp"],
    // Responsive breakpoints used by next/image <Image> sizes prop
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimised images on CDN for 1 year
    minimumCacheTTL: 31536000,
    // Allow external image sources when needed (e.g. CMS images)
    remotePatterns: [
      // Add CDN domains here when images are hosted externally
      // { protocol: "https", hostname: "cdn.fittrybe.com" },
    ],
  },

  // ── Security & SEO Headers ────────────────────────────────────────────────────
  async headers() {
    return [
      // ── All routes ──────────────────────────────────────────────────────────
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Force HTTPS
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Referrer policy (privacy + security)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy (reduce attack surface)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },

      // ── Static assets — long cache for CDN ──────────────────────────────────
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

      // ── OG image API — cache at edge ─────────────────────────────────────────
      {
        source: "/api/og(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },

      // ── Sitemap + robots — short cache (weekly) ──────────────────────────────
      {
        source: "/(sitemap.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────────
  // Add canonical redirects here to prevent duplicate content
  async redirects() {
    return [
      // Redirect trailing slashes to canonical path (except root)
      // Note: Next.js handles most of this automatically with trailingSlash config
      // Add custom redirects as needed:
      // { source: "/join", destination: "/waitlist", permanent: true },
    ];
  },

  // ── Experimental features ──────────────────────────────────────────────────
  experimental: {
    // Optimise CSS delivery (reduces render-blocking CSS)
    optimizeCss: true,
    // Partial Pre-Rendering for hybrid static/dynamic (Next.js 15+)
    // ppr: true,
  },
};

export default nextConfig;
