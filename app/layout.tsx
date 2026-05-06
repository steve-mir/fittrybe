/**
 * ─── Fittrybe — Root Layout ───────────────────────────────────────────────────
 * SEO: Metadata API + JSON-LD + next/font + GA4 + preconnect hints
 */

import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { seoConfig } from "@/lib/seo-config";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildGraphSchema,
} from "@/lib/structured-data";

// ─── Font Optimisation ────────────────────────────────────────────────────────
// Display + body fonts to match fittrybe.app
const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
  preload: true,
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter-tight",
  display: "swap",
  preload: true,
});

// ─── Global Metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.description,
  // keywords: seoConfig.keywords,
  authors: [{ name: seoConfig.author.name, url: seoConfig.author.url }],
  creator: seoConfig.creator,
  publisher: seoConfig.publisher,
  alternates: {
    canonical: seoConfig.siteUrl,
    // Site is en-GB only — declaring en-US would create duplicate-content
    // signals. Use x-default so search engines don't assume a region.
    languages: {
      "en-GB": seoConfig.siteUrl,
      "x-default": seoConfig.siteUrl,
    },
  },
  robots: seoConfig.robotsDefault,
  openGraph: {
    type: "website",
    locale: seoConfig.siteLocale,
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    title: seoConfig.defaultTitle,
    description: seoConfig.shortDescription,
    images: [
      {
        // Absolute URL — WhatsApp/Facebook crawlers cannot resolve
        // relative og:image paths. metadataBase handles most cases but
        // being explicit here avoids edge bugs on preview deployments.
        url: seoConfig.defaultOGImage.url,
        secureUrl: seoConfig.defaultOGImage.url,
        width: seoConfig.defaultOGImage.width,
        height: seoConfig.defaultOGImage.height,
        alt: seoConfig.defaultOGImage.alt,
        type: seoConfig.defaultOGImage.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.defaultTitle,
    description: seoConfig.shortDescription,
    site: seoConfig.twitterHandle,
    creator: seoConfig.twitterHandle,
    images: [seoConfig.defaultOGImage.url],
  },
  applicationName: seoConfig.applicationName,
  category: seoConfig.category,
  appleWebApp: {
    capable: true,
    title: seoConfig.siteName,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: seoConfig.themeColor },
    { media: "(prefers-color-scheme: light)", color: seoConfig.themeColor },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const globalJsonLd = buildGraphSchema([buildOrganizationSchema(), buildWebSiteSchema()]);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={seoConfig.siteLanguage} dir="ltr" className={`${anton.variable} ${interTight.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: globalJsonLd }} />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        {seoConfig.analytics.ga4MeasurementId && (
          <link rel="preconnect" href="https://www.googletagmanager.com" />
        )}
      </head>
      <body>
        {children}
        {seoConfig.analytics.ga4MeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${seoConfig.analytics.ga4MeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seoConfig.analytics.ga4MeasurementId}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
        {seoConfig.analytics.metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seoConfig.analytics.metaPixelId}');fbq('track','PageView');`}
            </Script>
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${seoConfig.analytics.metaPixelId}&ev=PageView&noscript=1" alt="" />`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
