import type { Metadata, Viewport } from "next";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: "Fittrybe — Find Your Game. Play With Your City.",
    template: "%s | Fittrybe",
  },
  description:
    "Fittrybe is a location-based social sports app. Discover real sports sessions near you, reserve your spot in one tap, and meet your tribe. Football, basketball, badminton, tennis and more.",
  keywords: [
    "local sports",
    "sports sessions near me",
    "find football game",
    "find basketball game",
    "social sports app",
    "sports community",
    "join a sports team",
    "local sports events",
    "fittrybe",
    "play sport locally",
    "sports near me",
    "casual sports",
    "badminton near me",
    "tennis near me",
    "running group near me",
  ],

  // ── Authors & Creator ──────────────────────────────────────────────────────
  authors: [{ name: "Fittrybe", url: "https://fittrybe.com" }],
  creator: "Fittrybe",
  publisher: "Fittrybe",

  // ── Canonical & Alternate ──────────────────────────────────────────────────
  alternates: {
    canonical: "https://fittrybe.com",
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://fittrybe.com",
    siteName: "Fittrybe",
    title: "Fittrybe — Find Your Game. Play With Your City.",
    description:
      "Discover real sports sessions near you. Join a game, meet your tribe, show up and play. Local sport — made social and consistent.",
    images: [
      {
        url: "https://fittrybe.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fittrybe — Find Your Game",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Fittrybe — Find Your Game. Play With Your City.",
    description:
      "Discover real sports sessions near you. Join a game, meet your tribe, show up and play.",
    site: "@fittrybe",
    creator: "@fittrybe",
    images: ["https://fittrybe.com/og-image.jpg"],
  },

  // ── App-specific ──────────────────────────────────────────────────────────
  applicationName: "Fittrybe",
  category: "sports",
  classification: "Sports & Recreation",

  // ── App Store Links (for app banners) ─────────────────────────────────────
  appleWebApp: {
    capable: true,
    title: "Fittrybe",
    statusBarStyle: "black-translucent",
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // ── Manifest ──────────────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // ── Verification ──────────────────────────────────────────────────────────
  // Uncomment and fill in once you have these codes:
  // verification: {
  //   google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
  //   yandex: "YOUR_YANDEX_VERIFICATION",
  //   bing: "YOUR_BING_SITE_AUTH",
  // },

  // ── Other ─────────────────────────────────────────────────────────────────
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#B6FF00",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ─── Structured Data (JSON-LD) ────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://fittrybe.com/#website",
      url: "https://fittrybe.com",
      name: "Fittrybe",
      description: "Local social sports app — find sessions, join games, meet your tribe.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://fittrybe.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://fittrybe.com/#organization",
      name: "Fittrybe",
      url: "https://fittrybe.com",
      logo: {
        "@type": "ImageObject",
        url: "https://fittrybe.com/logo.png",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://instagram.com/fittrybe",
        "https://twitter.com/fittrybe",
        "https://tiktok.com/@fittrybe",
      ],
    },
    {
      "@type": "MobileApplication",
      "@id": "https://fittrybe.com/#app",
      name: "Fittrybe",
      operatingSystem: "iOS, Android",
      applicationCategory: "SportsApplication",
      description:
        "Discover real sports sessions near you. Join a game, meet your tribe, show up and play.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
      },
    },
  ],
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect to font origin */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}