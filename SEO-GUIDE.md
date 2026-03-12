# Fittrybe — SEO Implementation & Validation Guide

## What Was Implemented

This guide documents all SEO changes and how to validate them.

---

## Files Created / Modified

| File | Action | Purpose |
|------|--------|---------|
| `lib/seo-config.ts` | **Created** | Single source of truth for all SEO config |
| `lib/structured-data.ts` | **Created** | All JSON-LD schema builders |
| `app/layout.tsx` | **Modified** | next/font, global metadata, JSON-LD, GA4 |
| `app/page.tsx` | **Modified** | Page-level metadata, WebPage + App + FAQ schemas |
| `app/waitlist/page.tsx` | **Modified** | Conversion-focused metadata, BreadcrumbList schema |
| `app/api/og/route.ts` | **Created** | Dynamic 1200×630 OG image generation |
| `app/sitemap.ts` | **Created** | Auto-generated XML sitemap |
| `app/robots.ts` | **Created** | robots.txt with AI search engine directives |
| `app/blog/[slug]/page.tsx` | **Created** | Programmatic SEO architecture |
| `components/LandingPageClient.tsx` | **Created** | Landing UI with semantic HTML + a11y |
| `components/WaitlistPageClient.tsx` | **Created** | Waitlist UI with proper labels + a11y |
| `next.config.ts` | **Modified** | Security headers, image optimisation, caching |
| `public/manifest.json` | **Created** | PWA manifest |
| `.env.local.example` | **Created** | Env variable reference |

---

## Section-by-Section Validation

### 1. Global SEO Architecture
**Test:** Verify `seo-config.ts` values flow through to all pages.
```bash
# Build and inspect metadata output
npm run build
# Check Open Graph tags on rendered HTML
curl https://fittrybe.com | grep 'og:'
```

---

### 2. Metadata API
**Test URLs:**
- https://metatags.io/?url=https://fittrybe.com
- https://metatags.io/?url=https://fittrybe.com/waitlist
- https://socialsharepreview.com/?url=https://fittrybe.com

**What to check:**
- ✅ Title matches `seoConfig.pages.home.title`
- ✅ Description is under 160 characters
- ✅ OG image displays correctly at 1200×630
- ✅ Twitter card shows `summary_large_image`
- ✅ Canonical URL is correct on each page

---

### 3. Structured Data (JSON-LD)
**Test:** Google Rich Results Test
- https://search.google.com/test/rich-results
- Enter `https://fittrybe.com` → should detect: Organization, WebSite, MobileApplication, FAQPage
- Enter `https://fittrybe.com/waitlist` → should detect: WebPage, BreadcrumbList

**Manual check:**
```bash
# Inspect the page source for JSON-LD scripts
curl https://fittrybe.com | grep -A 100 'application/ld+json'
```

**Schema.org validator:**
- https://validator.schema.org/
- Paste your page URL or the raw JSON-LD

---

### 4. OG Image Generation
**Test URL:** https://fittrybe.com/api/og?title=Find+Your+Game
- Should render a 1200×630 PNG
- Test custom titles: `/api/og?title=Join+the+Waitlist&description=Get+early+access`

**Social preview tools:**
- Twitter/X: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/

---

### 5. Sitemap
**Test URL:** https://fittrybe.com/sitemap.xml
- Should return valid XML
- Validate at: https://www.xml-sitemaps.com/validate-xml-sitemap.html

**Submit to Search Consoles:**
1. Google Search Console → Sitemaps → Add `https://fittrybe.com/sitemap.xml`
2. Bing Webmaster Tools → Sitemaps → Submit URL

---

### 6. Robots.txt
**Test URL:** https://fittrybe.com/robots.txt
- Should list `Sitemap: https://fittrybe.com/sitemap.xml`
- Should allow GPTBot, PerplexityBot, ClaudeBot
- Validate at: https://www.google.com/webmasters/tools/robots-testing-tool

---

### 7. Core Web Vitals
**Test tools:**
- PageSpeed Insights: https://pagespeed.web.dev/?url=https://fittrybe.com
- Chrome DevTools → Lighthouse → Performance
- WebPageTest: https://www.webpagetest.org/

**Targets:**
| Metric | Target | Good |
|--------|--------|------|
| LCP | < 2.5s | < 4.0s |
| CLS | < 0.1 | < 0.25 |
| INP | < 200ms | < 500ms |
| TTFB | < 800ms | < 1800ms |

**Improvements made:**
- `next/font` eliminates render-blocking Google Fonts (CLS fix)
- `next/image` with `priority` on hero images (LCP fix)
- Videos have `lazy` loading on non-hero instances
- GA4 script loads with `async` and is deferred to `<body>` end

---

### 8. Accessibility (SEO Signal)
**Test:**
```bash
# Install axe CLI
npm install -g @axe-core/cli
axe https://fittrybe.com --exit
```
**Or use:** https://wave.webaim.org/report#/https://fittrybe.com

**What to check:**
- ✅ All images have `alt` text
- ✅ Form inputs have `<label htmlFor>` linked
- ✅ Buttons have `aria-label`
- ✅ Interactive elements are keyboard navigable
- ✅ Heading hierarchy: H1 → H2 → H3 (no skipped levels)
- ✅ `lang="en"` on `<html>`
- ✅ Colour contrast ratio ≥ 4.5:1 for text

---

### 9. Search Console Setup

#### Google Search Console
1. Go to https://search.google.com/search-console/
2. Add property: `https://fittrybe.com`
3. Verify via HTML meta tag:
   - Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxxx` to `.env.local`
   - Deploy → Google auto-verifies
4. Submit sitemap: `https://fittrybe.com/sitemap.xml`
5. Monitor: Coverage, Core Web Vitals, Rich Results

#### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters/
2. Add site: `https://fittrybe.com`
3. Verify via meta tag: `NEXT_PUBLIC_BING_SITE_AUTH=xxxxx`
4. Submit sitemap

---

### 10. AI Search Engine Optimisation

**What was done:**
- `robots.ts` explicitly allows GPTBot, PerplexityBot, Google-Extended, ClaudeBot
- FAQ section added to landing page (AI engines love Q&A structured content)
- `FAQPage` JSON-LD schema implemented
- Semantic HTML5 (`<main>`, `<section aria-label>`, `<article>`, `<header>`, `<footer>`)
- Descriptive paragraphs in each section (not just UI copy)
- H1 → H2 → H3 heading hierarchy maintained

**Monitor AI citations:**
- Search Perplexity.ai for "Fittrybe" or "local sports app UK"
- Search ChatGPT for "social sports app UK"
- If not appearing, increase content depth on key pages

---

### 11. Dynamic OG Images — Cache Busting
The OG images are cached at the edge for 24h. To force a refresh:
```bash
# Append a version query param when content changes significantly
/api/og?title=New+Title&v=2
```

---

## Ongoing SEO Checklist

**Monthly:**
- [ ] Check Google Search Console for crawl errors
- [ ] Review Core Web Vitals report
- [ ] Check for new keywords to target in Google Search Console → Performance
- [ ] Update `lastModified` in sitemap.ts after major content changes

**Quarterly:**
- [ ] Audit internal link structure
- [ ] Review and expand FAQ section
- [ ] Check competitor keyword rankings
- [ ] Update `dateModified` in WebPage schema for updated pages

**When adding new pages:**
1. Add metadata export with page-specific title, description, canonical
2. Add JSON-LD schema (WebPage + any relevant specific schema)
3. Add to `app/sitemap.ts`
4. Add internal links from existing pages to the new page
5. Test with Rich Results Test

---

## Environment Variables Required

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxxxxxxxxxxx
NEXT_PUBLIC_BING_SITE_AUTH=xxxxxxxxxxxxx
NEXT_PUBLIC_YANDEX_VERIFICATION=xxxxxxxxxxxxx
```

---

## Tech Stack Versions

| Package | Version | SEO Relevance |
|---------|---------|---------------|
| Next.js | 16.x | App Router, Metadata API, ImageResponse |
| React | 19.x | Server Components for SSR |
| next/font | built-in | Eliminates render-blocking fonts |
| next/image | built-in | Automatic WebP/AVIF, lazy loading |
| @vercel/og | via next | Dynamic OG image generation |

---

*Last updated: 2025 — Fittrybe SEO Implementation v1.0*
