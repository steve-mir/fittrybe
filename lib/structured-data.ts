/**
 * ─── Fittrybe — Structured Data (JSON-LD) Schemas ────────────────────────────
 *
 * All Schema.org structured data for the site.
 * Each function returns a plain object ready to be serialised via
 * JSON.stringify and injected as <script type="application/ld+json">.
 *
 * Schemas covered:
 *   • Organization
 *   • WebSite (with SearchAction)
 *   • MobileApplication / SoftwareApplication
 *   • WebPage (generic + per-page)
 *   • FAQPage
 *   • BreadcrumbList
 */

import { seoConfig } from "./seo-config";

// ─── Organization ─────────────────────────────────────────────────────────────
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${seoConfig.siteUrl}/#organization`,
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: {
      "@type": "ImageObject",
      "@id": `${seoConfig.siteUrl}/#logo`,
      url: seoConfig.logo.url,
      width: seoConfig.logo.width,
      height: seoConfig.logo.height,
      caption: seoConfig.siteName,
    },
    image: seoConfig.logo.url,
    description: seoConfig.description,
    email: seoConfig.author.email,
    foundingDate: "2024",
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 10,
    },
    sameAs: Object.values(seoConfig.socialLinks),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: seoConfig.author.email,
    },
  };
}

// ─── WebSite ──────────────────────────────────────────────────────────────────
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${seoConfig.siteUrl}/#website`,
    url: seoConfig.siteUrl,
    name: seoConfig.siteName,
    description: seoConfig.shortDescription,
    publisher: {
      "@id": `${seoConfig.siteUrl}/#organization`,
    },
    inLanguage: seoConfig.siteLanguage,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── MobileApplication ────────────────────────────────────────────────────────
export function buildAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "@id": `${seoConfig.siteUrl}/#app`,
    name: seoConfig.siteName,
    operatingSystem: "iOS, Android",
    applicationCategory: "SportsApplication",
    applicationSubCategory: "Social Sports",
    description: seoConfig.description,
    url: seoConfig.siteUrl,
    author: {
      "@id": `${seoConfig.siteUrl}/#organization`,
    },
    publisher: {
      "@id": `${seoConfig.siteUrl}/#organization`,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      availability: "https://schema.org/PreOrder",
      priceValidUntil: "2026-12-31",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
      bestRating: "5",
      worstRating: "1",
    },
    screenshot: seoConfig.defaultOGImage.url,
    featureList: [
      "Discover local sports sessions",
      "Reserve a spot in one tap",
      "Connect with nearby players",
      "Football, basketball, tennis, badminton and more",
      "Location-based sport discovery",
      "Real-time session availability",
    ],
    keywords: seoConfig.keywords.slice(0, 10).join(", "),
  };
}

// ─── WebPage ──────────────────────────────────────────────────────────────────
export function buildWebPageSchema({
  url,
  title,
  description,
  datePublished = "2024-01-01",
  dateModified,
  breadcrumb,
}: {
  url: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: Array<{ name: string; url: string }>;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}/#webpage`,
    url,
    name: title,
    description,
    isPartOf: {
      "@id": `${seoConfig.siteUrl}/#website`,
    },
    about: {
      "@id": `${seoConfig.siteUrl}/#organization`,
    },
    inLanguage: seoConfig.siteLanguage,
    datePublished,
    dateModified: dateModified ?? datePublished,
    potentialAction: {
      "@type": "ReadAction",
      target: url,
    },
  };

  if (breadcrumb && breadcrumb.length > 0) {
    schema.breadcrumb = buildBreadcrumbSchema(breadcrumb);
  }

  return schema;
}

// ─── FAQPage ──────────────────────────────────────────────────────────────────
export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

// ─── BreadcrumbList ───────────────────────────────────────────────────────────
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── @graph bundle (combine multiple schemas in one <script> tag) ─────────────
export function buildGraphSchema(
  schemas: Array<Record<string, unknown>>
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": schemas.map((s) => {
      // strip individual @context when bundled
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { "@context": _ctx, ...rest } = s;
      return rest;
    }),
  });
}

// ─── Landing page FAQs (used by both FAQ schema + visible FAQ section) ────────
export const LANDING_FAQS = [
  {
    question: "What is Fittrybe?",
    answer:
      "Fittrybe is a location-based social sports app that helps you discover real sports sessions near you. You can browse games, reserve your spot in one tap, and meet other players in your city.",
  },
  {
    question: "How does Fittrybe work?",
    answer:
      "Open the app, allow location access, and instantly see live sports sessions near you — football, basketball, tennis, badminton, and more. Tap a session to view details and reserve your spot. Show up, play, and connect with your new tribe.",
  },
  {
    question: "What sports does Fittrybe support?",
    answer:
      "Fittrybe currently supports football (soccer), basketball, tennis, badminton, running groups, cycling, swimming, gym sessions, and boxing. More sports are added regularly based on community demand.",
  },
  {
    question: "Is Fittrybe free?",
    answer:
      "Yes — joining Fittrybe and browsing sessions is completely free. Some hosted sessions may have a small venue or organiser fee, but the app itself costs nothing to download and use.",
  },
  {
    question: "When does Fittrybe launch?",
    answer:
      "Fittrybe is currently in pre-launch. Join the waitlist to get early access when we launch in your city. We are targeting a 2026 launch across major UK cities.",
  },
  {
    question: "Where is Fittrybe available?",
    answer:
      "Fittrybe will initially launch in major UK cities including London, Manchester, Birmingham, and Bristol. Global expansion is planned for 2026 and beyond.",
  },
];

// ─── SportsEvent ──────────────────────────────────────────────────────────────
export function buildEventSchema({
  title,
  description,
  startsAt,
  placeName,
  placeVicinity,
  locationArea,
  placeLat,
  placeLng,
  joinPricePence,
  spotsLeft,
  isCancelled,
  ogImage,
  canonicalUrl,
}: {
  title: string;
  description: string | null;
  startsAt: string;
  placeName: string;
  placeVicinity: string;
  locationArea: string;
  placeLat: string;
  placeLng: string;
  joinPricePence: number;
  spotsLeft: number;
  isCancelled: boolean;
  ogImage: string;
  canonicalUrl: string;
}) {
  const availability =
    spotsLeft <= 0
      ? "https://schema.org/SoldOut"
      : spotsLeft <= 3
      ? "https://schema.org/LimitedAvailability"
      : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": `${canonicalUrl}/#event`,
    name: title,
    ...(description ? { description } : {}),
    url: canonicalUrl,
    startDate: startsAt,
    location: {
      "@type": "Place",
      name: placeName,
      address: {
        "@type": "PostalAddress",
        streetAddress: placeVicinity,
        addressLocality: locationArea,
        addressCountry: "GB",
      },
      ...(placeLat
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: placeLat,
              longitude: placeLng,
            },
          }
        : {}),
    },
    offers: {
      "@type": "Offer",
      price: joinPricePence === 0 ? "0" : (joinPricePence / 100).toFixed(2),
      priceCurrency: "GBP",
      availability,
      url: canonicalUrl,
    },
    organizer: {
      "@type": "Organization",
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
    },
    image: ogImage,
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };
}

// ─── ItemList (for events listing page) ──────────────────────────────────────
export function buildItemListSchema(
  events: Array<{ id: string }>,
  baseUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming Sports Sessions",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${baseUrl}/events/${event.id}`,
    })),
  };
}
