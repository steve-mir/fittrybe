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
| `app/events/page.tsx` | **Modified** | CollectionPage + ItemList + FAQ schema, "Browse by city" block |
| `app/events/[id]/page.tsx` | **Modified** | Enhanced SportsEvent schema, related-events block, noindex past/cancelled |
| `app/events/in/[city]/page.tsx` | **Created** | City programmatic SEO landing |
| `app/events/[id]/in/[city]/page.tsx` | **Created** | Sport+city programmatic SEO landing |
| `app/venues/page.tsx` | **Created** | Partner-venue index hub |
| `app/venues/[slug]/page.tsx` | **Created** | Per-venue page with SportsActivityLocation schema |
| `lib/venues.ts` | **Created** | Partner-venue helpers (slug resolution, fetches) |
| `lib/events.ts` | **Modified** | Added city helpers, related-events query, host/review aggregation |
| `lib/structured-data.ts` | **Modified** | Enhanced SportsEvent, ItemList with embedded items, CollectionPage, SportsActivityLocation |
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
curl https://fittrybe.co.uk | grep 'og:'
```

---

### 2. Metadata API
**Test URLs:**
- https://metatags.io/?url=https://fittrybe.co.uk
- https://metatags.io/?url=https://fittrybe.co.uk/waitlist
- https://socialsharepreview.com/?url=https://fittrybe.co.uk

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
- Enter `https://fittrybe.co.uk` → should detect: Organization, WebSite, MobileApplication, FAQPage
- Enter `https://fittrybe.co.uk/waitlist` → should detect: WebPage, BreadcrumbList

**Manual check:**
```bash
# Inspect the page source for JSON-LD scripts
curl https://fittrybe.co.uk | grep -A 100 'application/ld+json'
```

**Schema.org validator:**
- https://validator.schema.org/
- Paste your page URL or the raw JSON-LD

---

### 4. OG Image Generation
**Test URL:** https://fittrybe.co.uk/api/og?title=Find+Your+Game
- Should render a 1200×630 PNG
- Test custom titles: `/api/og?title=Join+the+Waitlist&description=Get+early+access`

**Social preview tools:**
- Twitter/X: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/

---

### 5. Sitemap
**Test URL:** https://fittrybe.co.uk/sitemap.xml
- Should return valid XML
- Validate at: https://www.xml-sitemaps.com/validate-xml-sitemap.html

**Submit to Search Consoles:**
1. Google Search Console → Sitemaps → Add `https://fittrybe.co.uk/sitemap.xml`
2. Bing Webmaster Tools → Sitemaps → Submit URL

---

### 6. Robots.txt
**Test URL:** https://fittrybe.co.uk/robots.txt
- Should list `Sitemap: https://fittrybe.co.uk/sitemap.xml`
- Should allow GPTBot, PerplexityBot, ClaudeBot
- Validate at: https://www.google.com/webmasters/tools/robots-testing-tool

---

### 7. Core Web Vitals
**Test tools:**
- PageSpeed Insights: https://pagespeed.web.dev/?url=https://fittrybe.co.uk
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
axe https://fittrybe.co.uk --exit
```
**Or use:** https://wave.webaim.org/report#/https://fittrybe.co.uk

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
2. Add property: `https://fittrybe.co.uk`
3. Verify via HTML meta tag:
   - Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxxx` to `.env.local`
   - Deploy → Google auto-verifies
4. Submit sitemap: `https://fittrybe.co.uk/sitemap.xml`
5. Monitor: Coverage, Core Web Vitals, Rich Results

#### Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters/
2. Add site: `https://fittrybe.co.uk`
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

---

## Events SEO — v1.1 (May 2026)

### What's new

#### 1. Enhanced `SportsEvent` JSON-LD (`lib/structured-data.ts`)
The schema now emits the full vocabulary Google's events rich-results
guidelines reward:

- `endDate` — derived from sport-specific `duration_minutes` when not explicit
- `inLanguage: "en-GB"`
- `maximumAttendeeCapacity` + `remainingAttendeeCapacity` — pulled from
  the per-sport detail tables (`football_details.capacity`, etc.)
- `performer` — populated from the host profile (`profiles.display_name`)
- `superEvent` — child sessions in a recurring series link back to the parent
- `previousStartDate` — set when the session is cancelled so Google can
  reconcile the event-cancelled signal correctly
- `aggregateRating` — computed from `session_reviews.session_rating` and
  only emitted when at least one rating exists (no fake reviews)
- `offers.validFrom` + `inventoryLevel` — gives offer signals more depth
- `keywords` — sport + location synthesised per event
- `address.addressRegion` + `geo` always populated when coordinates exist

#### 2. Programmatic event pages

| Route | Purpose | Schema emitted |
|-------|---------|----------------|
| `/events/in/[city]` | City landing — long-tail "sports in [city]" | CollectionPage + ItemList + FAQPage + Breadcrumb |
| `/events/[sport]/in/[city]` | Sport+city — "[sport] in [city]" | CollectionPage + ItemList + FAQPage + Breadcrumb |
| `/venues/[slug]` | Per-venue page from `partner_venues` | SportsActivityLocation + CollectionPage + Breadcrumb |
| `/venues` | Venue hub | CollectionPage |

City slugs are derived from `sessions.location_area` deterministically
(`citySlug()` in `lib/events.ts`). Venue slugs are derived from venue
`name` + `city` so routes are stable.

`generateStaticParams` is intentionally capped:
- Top 30 cities are prebuilt; the rest come from ISR on-demand
- Top 10 cities × all sports = 90 sport+city combos prebuilt; rest ISR
- All active venues are prebuilt (curated set, ~few hundred max)

#### 3. Past + cancelled event handling
- `app/events/[id]` sets `robots: noindex, follow` when the event is in
  the past or cancelled
- The page still renders cleanly with a "browse upcoming" CTA pointing at
  the sport+city variant — preserves shared deep-link UX
- Sitemap excludes cancelled events entirely

#### 4. Sitemap restructuring
Now includes (in addition to the existing static + sport hub + blog URLs):
- Every city with ≥1 upcoming session → `/events/in/[city]`
- Top 20 cities × all sports → `/events/[sport]/in/[city]`
- All active partner venues → `/venues/[slug]`
- `/venues` index
- Upcoming, non-cancelled events use `updated_at` (not `now`) for
  `lastModified` so crawl budget tracks real change

### Validation steps

#### Rich Results Test (per page type)

| Page | URL pattern | Expected schemas |
|------|-------------|-------------------|
| Event detail | `/events/{id}` | SportsEvent, WebPage, BreadcrumbList |
| City listing | `/events/in/{city}` | CollectionPage, ItemList, FAQPage, BreadcrumbList |
| Sport+city | `/events/{sport}/in/{city}` | CollectionPage, ItemList, FAQPage, BreadcrumbList |
| Venue | `/venues/{slug}` | SportsActivityLocation, CollectionPage, BreadcrumbList |

Test each via https://search.google.com/test/rich-results.

#### SportsEvent extras
For an active event detail page:
```bash
curl -s https://fittrybe.co.uk/events/{id} | \
  grep -A 200 'application/ld+json' | head -200
```
Confirm presence of: `endDate`, `eventStatus`, `eventAttendanceMode`,
`offers.availability`, `location.geo`, `organizer`, and (when host
exists) `performer`.

#### Past-event noindex
Visit any past event URL and confirm:
```bash
curl -sI https://fittrybe.co.uk/events/{past-id} | grep -i x-robots-tag
```
Page-level `<meta name="robots" content="noindex, follow">` is also
emitted via Next.js `robots` metadata.

#### Sitemap coverage
After each release, hit `/sitemap.xml` and confirm:
- City pages present for every populated `location_area`
- Venue pages present for every `partner_venues.is_active = true` row
- No cancelled or past events in the event-detail block
- Total URL count well under 50,000

### Ongoing checklist additions

**Per release:**
- [ ] Run Rich Results Test on a sample event detail page
- [ ] Run Rich Results Test on a sample city + sport+city page
- [ ] Confirm `lib/sports.ts` keyword arrays still match the targeted
      long-tail queries (refresh after Google Search Console insights)

**Quarterly:**
- [ ] Audit `partner_venues` for stale entries — venues that haven't
      hosted in 6 months should be `is_active = false`
- [ ] Review which cities consistently produce zero events — consider
      consolidating into broader area names in the host UX
- [ ] Pull top "Queries" report from GSC and add high-impression /
      low-CTR queries to the sport content library FAQs

---

## Sessions SEO — v1.2 (May 2026)

### Goal
Maximise content depth on session detail pages so each `/events/[id]` is
a uniquely indexable, long-tail-rich landing page rather than a generic
event template. Visible-content focus (existing JSON-LD untouched) — the
biggest unrealised SEO lever was that the page rendered ~5% of the data
hosts already write per session.

### What's new

#### 1. Full sport-specific data fetcher (`lib/events.ts`)
`getEventWithExtras` now selects `*` from the per-sport detail table and
funnels every column into a sport-agnostic `SessionRichDetails` shape:

| Common | Sport-specific |
|--------|----------------|
| `description`, `skillLevel`, `genderPreference`, `whatToBring[]`, `houseRules[]`, `additionalNotes`, `meetingInstructions`, `parkingInfo`, `publicTransportInfo`, `amenities` (5 booleans) | football: `gameFormat`, `pitchType`, `ballProvided`, `bibsProvided` <br> basketball: `gameFormat`, `courtType`, `courtNumber` <br> cycling: `distanceKm`, `routeType`, `terrainType`, `elevationGainM`, `rideIntensity`, `bikeType`, `hasCoffeeStop`, `noDropRide` <br> running: `distanceKm`, `paceType`, `routeType`, `terrainType`, `elevationGainM` <br> gym: `sessionType`, `focusArea`, `requiresMembership`, `meetingPointTitle` <br> racket: `courtType`, `courtSurface`, `numberOfSets`, `gamesPerSet`, `scoringSystem`, `coachPresent`, `ownRacketRequired`, `warmUpMinutes` |

Helpers also added:
- `getOtherSessionsByHost()` — feeds the "More from this host" block
- `resolvePartnerVenueForSession()` — links into `/venues/[slug]` when
  the event's `place_name + city` matches an active partner venue
- `buildSessionMetaDescription()` — sport-aware meta description
  generator (folds `gameFormat`, `skillLevel`, `pitchType`, `distanceKm`
  into the SERP snippet)
- `buildSessionKeywords()` — long-tail keyword set including
  detail-driven terms ("5-a-side astroturf redhill", "12km loop running")

#### 2. New visible sections on `/events/[id]`
All sections render only when their underlying data exists — no empty
headers. Each section is keyword-rich, semantically marked up, and
crawler-visible:

| Section | Source columns | SEO win |
|---------|----------------|---------|
| Session Details (chip row) | `game_format`, `match_type`, `skill_level`, `pitch_type`, `court_type`, `court_surface`, `session_type`, `focus_area`, `bike_type`, `pace_type`, `route_type`, `women_only`, `gender_preference` | Each chip is a sport-specific keyword on the rendered page |
| The Route (cycling/running) | `distance_km`, `elevation_gain_m`, `route_type`, `terrain_type`, `surface_type`, `ride_intensity`, `start_title`, `finish_title`, `has_coffee_stop` | Long-tail "12km route Redhill", "trail run elevation" |
| Match Format (racket) | `number_of_sets`, `games_per_set`, `scoring_system`, `warm_up_minutes`, `coach_present`, `coach_name` | Targets "tennis singles best of 3 Redhill" intent |
| What to Bring | `what_to_bring[]`, `ball_provided`, `bibs_provided`, `equipment_provided`, `balls_provided`, `own_racket_required` | Bulleted list — AI-engine friendly format |
| House Rules | `house_rules[]` / `rules[]` | Same — Q&A and rule lists are favoured by Perplexity/ChatGPT |
| Amenities | 5 boolean flags + `requires_membership` | Indexable amenity signals — "tennis with showers Redhill" |
| Getting There | `meeting_point_title`, `meeting_instructions`, `parking_info`, `public_transport_info` | Long-form host copy — uniquely written per session |

#### 3. Sport-aware metadata + OG image
- Meta description now reads
  `⚽ Football session at Goals Wembley, London — Sat 14 Mar at 19:00.
   5-a-side · Astroturf · Beginner. 3 spots open. £6.50 entry. Book on
   Fittrybe.` (was: generic "football session" copy)
- OG image subtitle is fed the same sport facts so social-share previews
  show "5-a-side · Astroturf · Beginner" instead of just the city name
- OG image route added a 3-tier font sizer (44/54/68pt) and hard
  truncation at 80 chars title / 140 chars description, eliminating
  layout overflow on long venue+title strings
- Schema's `image:[]` URL matches the social `og:image` so both hit the
  same edge cache instead of double-rendering

#### 4. Cross-link blocks (internal-link graph)
- **More from this host** — top 3 of the host's other upcoming sessions,
  rendered before the related-events grid. Spreads PageRank to host's
  full inventory.
- **View venue** — when `place_name` resolves against `partner_venues`,
  a "View {venue}" link is rendered in the Location block, funnelling
  crawlers from `/events/[id]` → `/venues/[slug]`.

#### 5. `/session/[id]` deep-link bridge — canonical fix
Previously the deep-link bridge had `canonical: undefined` and
`follow: false`. Now:
- `alternates.canonical` points at `/events/[id]`
- `robots.follow: true` so crawlers traverse the canonical link
- A visible `<a href="/events/[id]">` is server-rendered for crawlers
  and JS-disabled users to reach the indexed page

This means link equity from shared session URLs (which are
`/session/[id]` in the wild) consolidates onto the indexable
`/events/[id]` page instead of being wasted.

### Validation

After deploy, for any session with rich host-written data:

```bash
# Sport-specific facts should appear in the meta description
curl -s https://fittrybe.co.uk/events/{id} | grep -A1 'name="description"'

# Visible sections should render in source HTML
curl -s https://fittrybe.co.uk/events/{id} | grep -E 'What to Bring|House Rules|Session Details|Getting There'

# Deep-link canonical
curl -s https://fittrybe.co.uk/session/{id} | grep -E 'rel="canonical"'

# OG image subtitle
curl -s "https://fittrybe.co.uk/events/{id}" | grep 'og:image'
# → /api/og?title=...&description=5-a-side · Astroturf · Beginner&...
```

### Per-release additions
- [ ] Sample three event detail pages (one per sport family — pitch
      sport, endurance sport, racket sport) and confirm at least 4
      visible sections render
- [ ] Run Rich Results Test on the same three to confirm the existing
      `SportsEvent` JSON-LD still validates after the body changes

