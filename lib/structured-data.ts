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
    address: {
      "@type": "PostalAddress",
      addressCountry: "GB",
      addressLocality: "London",
    },
    areaServed: {
      "@type": "Country",
      name: "United Kingdom",
    },
    knowsAbout: [
      "social sports",
      "grassroots sports",
      "football",
      "basketball",
      "tennis",
      "badminton",
      "running",
      "cycling",
      "five-a-side",
      "sports community",
    ],
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
      areaServed: "GB",
      availableLanguage: ["en-GB"],
    },
  };
}

// ─── WebSite ──────────────────────────────────────────────────────────────────
// NOTE: SearchAction removed — pointing it at /search?q= when no search page
// exists violates Google's structured-data guidelines (target must resolve
// to a working SERP). Re-add when/if site search is implemented.
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
    // NOTE: aggregateRating intentionally omitted until we have real reviews.
    // Fake/self-issued ratings violate Google guidelines and can trigger a
    // manual action. Re-add via app store reviews / verified user surveys.
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
//
// Implements the full SportsEvent vocabulary that Google's events rich-result
// guidelines reward — endDate (required for reliability), capacity numbers,
// performer + organizer, recurring linking via superEvent, optional
// aggregateRating, and Place geo. Additional fields are gated so callers can
// pass partial data without breaking validation.
//
// Reference: https://developers.google.com/search/docs/appearance/structured-data/event
export function buildEventSchema({
  id,
  title,
  description,
  startsAt,
  endsAt,
  durationMinutes,
  placeName,
  placeVicinity,
  locationArea,
  placeLat,
  placeLng,
  postalCode,
  joinPricePence,
  spotsLeft,
  capacity,
  isCancelled,
  previousStartDate,
  ogImage,
  canonicalUrl,
  sportId,
  hostName,
  hostUrl,
  parentSessionUrl,
  aggregateRating,
  keywords,
}: {
  id?: string;
  title: string;
  description: string | null;
  startsAt: string;
  /** Explicit end timestamp. Falls back to startsAt + durationMinutes. */
  endsAt?: string | null;
  /** If endsAt is missing this is used to compute it. Defaults to 60 min. */
  durationMinutes?: number | null;
  placeName: string;
  placeVicinity: string;
  locationArea: string;
  placeLat: string | number | null;
  placeLng: string | number | null;
  postalCode?: string | null;
  joinPricePence: number;
  spotsLeft: number;
  capacity?: number | null;
  isCancelled: boolean;
  /** Original start date when the event was cancelled / rescheduled. */
  previousStartDate?: string | null;
  ogImage: string;
  canonicalUrl: string;
  sportId?: string;
  hostName?: string | null;
  hostUrl?: string | null;
  /** URL of the parent recurring session, if this is a child. */
  parentSessionUrl?: string | null;
  aggregateRating?: { ratingValue: number; reviewCount: number } | null;
  keywords?: string[];
}) {
  const availability =
    spotsLeft <= 0
      ? "https://schema.org/SoldOut"
      : spotsLeft <= 3
      ? "https://schema.org/LimitedAvailability"
      : "https://schema.org/InStock";

  // Compute endDate — Google strongly prefers it for SportsEvent results.
  const endDate =
    endsAt ??
    (() => {
      const start = new Date(startsAt).getTime();
      const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
      return new Date(start + minutes * 60_000).toISOString();
    })();

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": id ? `${canonicalUrl}/#event-${id}` : `${canonicalUrl}/#event`,
    name: title,
    ...(description ? { description } : {}),
    url: canonicalUrl,
    startDate: startsAt,
    endDate,
    inLanguage: seoConfig.siteLanguage,
    location: {
      "@type": "Place",
      name: placeName,
      address: {
        "@type": "PostalAddress",
        ...(placeVicinity ? { streetAddress: placeVicinity } : {}),
        addressLocality: locationArea,
        ...(postalCode ? { postalCode } : {}),
        addressRegion: locationArea,
        addressCountry: "GB",
      },
      ...(placeLat && placeLng
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: typeof placeLat === "string" ? Number(placeLat) : placeLat,
              longitude: typeof placeLng === "string" ? Number(placeLng) : placeLng,
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
      validFrom: new Date(
        new Date(startsAt).getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      ...(capacity ? { inventoryLevel: spotsLeft } : {}),
    },
    organizer: {
      "@type": "Organization",
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
    },
    ...(hostName
      ? {
          performer: {
            "@type": "Person",
            name: hostName,
            ...(hostUrl ? { url: hostUrl } : {}),
          },
        }
      : {}),
    image: [ogImage],
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(capacity
      ? {
          maximumAttendeeCapacity: capacity,
          remainingAttendeeCapacity: Math.max(spotsLeft, 0),
        }
      : {}),
    ...(parentSessionUrl
      ? {
          superEvent: {
            "@type": "SportsEvent",
            "@id": `${parentSessionUrl}/#event`,
            url: parentSessionUrl,
          },
        }
      : {}),
    ...(previousStartDate ? { previousStartDate } : {}),
    ...(sportId
      ? {
          sport: sportId.charAt(0).toUpperCase() + sportId.slice(1),
        }
      : {}),
    ...(keywords && keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    ...(aggregateRating && aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(aggregateRating.ratingValue.toFixed(2)),
            reviewCount: aggregateRating.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return schema;
}

// ─── ItemList (for events listing pages) ──────────────────────────────────────
//
// Richer than a bare list of URLs — Google ingests the embedded item objects to
// preview the list in SERP carousels. Each listItem embeds a minimal
// SportsEvent so the listing page itself can rank for "events near me".
export interface ItemListEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  durationMinutes?: number | null;
  sportId: string;
  placeName: string;
  locationArea: string;
  joinPricePence: number;
  spotsLeft: number;
  isCancelled: boolean;
  bannerUrl?: string | null;
  placeLat?: string | number | null;
  placeLng?: string | number | null;
}

export function buildItemListSchema(
  events: ItemListEvent[],
  baseUrl: string,
  options?: { name?: string; description?: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options?.name ?? "Upcoming Sports Sessions",
    ...(options?.description ? { description: options.description } : {}),
    numberOfItems: events.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: events.map((event, index) => {
      const url = `${baseUrl}/events/${event.id}`;
      const endDate =
        event.endsAt ??
        new Date(
          new Date(event.startsAt).getTime() +
            (event.durationMinutes && event.durationMinutes > 0
              ? event.durationMinutes
              : 60) *
              60_000
        ).toISOString();

      return {
        "@type": "ListItem",
        position: index + 1,
        url,
        item: {
          "@type": "SportsEvent",
          "@id": `${url}/#event`,
          name: event.title,
          url,
          startDate: event.startsAt,
          endDate,
          eventStatus: event.isCancelled
            ? "https://schema.org/EventCancelled"
            : "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: event.placeName,
            address: {
              "@type": "PostalAddress",
              addressLocality: event.locationArea,
              addressRegion: event.locationArea,
              addressCountry: "GB",
            },
            ...(event.placeLat && event.placeLng
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude:
                      typeof event.placeLat === "string"
                        ? Number(event.placeLat)
                        : event.placeLat,
                    longitude:
                      typeof event.placeLng === "string"
                        ? Number(event.placeLng)
                        : event.placeLng,
                  },
                }
              : {}),
          },
          offers: {
            "@type": "Offer",
            price:
              event.joinPricePence === 0
                ? "0"
                : (event.joinPricePence / 100).toFixed(2),
            priceCurrency: "GBP",
            availability:
              event.spotsLeft <= 0
                ? "https://schema.org/SoldOut"
                : event.spotsLeft <= 3
                ? "https://schema.org/LimitedAvailability"
                : "https://schema.org/InStock",
            url,
          },
          organizer: {
            "@type": "Organization",
            name: seoConfig.siteName,
            url: seoConfig.siteUrl,
          },
          ...(event.bannerUrl ? { image: [event.bannerUrl] } : {}),
          sport: event.sportId.charAt(0).toUpperCase() + event.sportId.slice(1),
        },
      };
    }),
  };
}

// ─── CollectionPage ──────────────────────────────────────────────────────────
// Used for /events, /events/in/[city], /events/[sport]/in/[city], /venues/[slug]
export function buildCollectionPageSchema({
  url,
  name,
  description,
  numberOfItems,
  breadcrumb,
}: {
  url: string;
  name: string;
  description: string;
  numberOfItems: number;
  breadcrumb?: Array<{ name: string; url: string }>;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}/#collection`,
    url,
    name,
    description,
    inLanguage: seoConfig.siteLanguage,
    isPartOf: { "@id": `${seoConfig.siteUrl}/#website` },
    about: { "@id": `${seoConfig.siteUrl}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems,
    },
  };
  if (breadcrumb && breadcrumb.length > 0) {
    schema.breadcrumb = buildBreadcrumbSchema(breadcrumb);
  }
  return schema;
}

// ─── SportsActivityLocation (for venue pages) ────────────────────────────────
export function buildSportsLocationSchema({
  name,
  description,
  url,
  address,
  city,
  postalCode,
  lat,
  lng,
  phone,
  website,
  image,
  sportTypes,
  amenities,
  rating,
}: {
  name: string;
  description?: string | null;
  url: string;
  address: string;
  city?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  image?: string | null;
  sportTypes?: string[];
  amenities?: string[];
  rating?: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${url}/#venue`,
    name,
    url,
    ...(description ? { description } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      ...(city ? { addressLocality: city } : {}),
      ...(postalCode ? { postalCode } : {}),
      addressCountry: "GB",
    },
    ...(lat && lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: lat,
            longitude: lng,
          },
        }
      : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(website ? { sameAs: [website] } : {}),
    ...(image ? { image: [image] } : {}),
    ...(sportTypes && sportTypes.length > 0
      ? { sport: sportTypes.map((s) => s.charAt(0).toUpperCase() + s.slice(1)) }
      : {}),
    ...(amenities && amenities.length > 0
      ? {
          amenityFeature: amenities.map((a) => ({
            "@type": "LocationFeatureSpecification",
            name: a,
            value: true,
          })),
        }
      : {}),
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(rating.toFixed(2)),
            reviewCount: 1,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    isAccessibleForFree: true,
  };
}
