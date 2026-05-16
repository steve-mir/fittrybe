/**
 * /session/[id] — Universal deep-link bridge
 *
 * Tries to open the native Fittrybe app; falls back to fittrybe.app.
 *
 * SEO: noindex but with `follow: true` and an explicit canonical pointing
 * at /events/[id]. Two reasons:
 *   1. Shared deep-link URLs in the wild (texts, group chats, social) are
 *      typically /session/[id]. Without a canonical, any inbound link
 *      equity is wasted on a noindexed page.
 *   2. follow: true (instead of nofollow) lets crawlers traverse to the
 *      indexed /events/[id] page — that's where the rankable content lives.
 *
 * Crawlers also see a server-rendered <a> link to /events/[id] so they
 * resolve the relationship even before JS runs.
 */

import type { Metadata } from "next";
import { buildCanonicalUrl } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonical = buildCanonicalUrl(`/events/${encodeURIComponent(id)}`);
  return {
    title: "Opening Fittrybe…",
    description: "Opening this session in the Fittrybe app.",
    robots: {
      index: false,
      follow: true, // let crawlers traverse the canonical link below
      nocache: true,
      googleBot: { index: false, follow: true },
    },
    alternates: { canonical },
  };
}

export default async function SessionDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeId = encodeURIComponent(id);
  const fallbackUrl = `https://fittrybe.app/session/${safeId}`;
  const appUrl = `fittrybe://session/${safeId}`;
  // Web equivalent of the deep-link — also the canonical destination.
  const webEquivalent = buildCanonicalUrl(`/events/${safeId}`);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* Crawler-safe fallback: meta refresh */}
      <meta httpEquiv="refresh" content={`2;url=${fallbackUrl}`} />
      <noscript>
        <p>
          Opening Fittrybe… If you are not redirected,{" "}
          <a href={fallbackUrl} style={{ color: "#B6FF00" }}>
            click here
          </a>
          .
        </p>
      </noscript>
      <div>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Opening Fittrybe…</p>
        {/* Crawler-visible link to the canonical web page so search engines
            traverse to the indexable /events/[id] route from this bridge. */}
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Or{" "}
          <a href={webEquivalent} style={{ color: "#B6FF00" }} rel="canonical">
            view this session on the web
          </a>
          .
        </p>
      </div>
      {/* Try native app first, then fallback */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var a=${JSON.stringify(appUrl)},b=${JSON.stringify(
            fallbackUrl
          )};window.location.href=a;setTimeout(function(){window.location.href=b;},1500);})();`,
        }}
      />
    </main>
  );
}
