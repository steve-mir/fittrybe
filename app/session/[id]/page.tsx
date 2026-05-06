/**
 * /session/[id] — Universal deep-link bridge
 *
 * Tries to open the native Fittrybe app; falls back to fittrybe.app.
 * SEO: noindex/nofollow — these are app handoff pages, not content.
 * Returns valid HTML (no nested <html>) and sets a server-side meta refresh
 * fallback for crawlers / users with JS disabled.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opening Fittrybe…",
  description: "Opening this session in the Fittrybe app.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: undefined },
};

export default async function SessionDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeId = encodeURIComponent(id);
  const fallbackUrl = `https://fittrybe.app/session/${safeId}`;
  const appUrl = `fittrybe://session/${safeId}`;

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
      <p style={{ fontSize: "1.1rem" }}>Opening Fittrybe…</p>
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
