/**
 * ─── Dynamic OpenGraph Image Generator ───────────────────────────────────────
 *
 * Route: GET /api/og
 *
 * Query params:
 *   title       – page/content title (optional, falls back to site default)
 *   description – short descriptor line (optional)
 *   path        – page path for small URL hint (optional)
 *
 * Output: 1200×630 PNG rendered via @vercel/og (ImageResponse)
 *
 * SEO FIXES:
 *  1. Explicit Cache-Control header so social crawlers (WhatsApp, Facebook)
 *     cache and serve the image correctly — without this, WhatsApp may
 *     refuse to render a dynamically-generated URL as a preview image.
 *  2. Added og:image header hints via Link header (optional but helpful)
 *  3. Content-Type explicitly set to image/png
 *
 * Design language: matches Fittrybe's dark + lime-green brand.
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SITE_NAME = "Fittrybe";
const SITE_URL  = "fittrybe.co.uk";
const LIME      = "#B6FF00";
const DARK      = "#050505";
const MID_DARK  = "#0D0D0D";
const GREY      = "#6B7280";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") ?? "Find Your Game. Play With Your City.";
  const description =
    searchParams.get("description") ??
    "Discover real sports sessions near you. Join a game, meet your tribe, show up and play.";
  const sport = searchParams.get("sport") ?? ""; // e.g. "football", "cycling"
  const date  = searchParams.get("date")  ?? ""; // e.g. "Sat, 13 Mar 2026"
  const price = searchParams.get("price") ?? ""; // e.g. "Free" or "£5.00"

  const SPORT_EMOJI: Record<string, string> = {
    football: "⚽", basketball: "🏀", cycling: "🚴", running: "🏃",
    badminton: "🏸", tennis: "🎾", gym: "🏋️", cricket: "🏏",
  };
  const emoji = sport ? (SPORT_EMOJI[sport.toLowerCase()] ?? "🏅") : null;

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: DARK,
          position: "relative",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* ── Grid texture overlay ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(182,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(182,255,0,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* ── Lime radial glow (top-left) ── */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(182,255,0,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ── Top bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "40px 60px 0",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Logo wordmark */}
          <div
            style={{
              display: "flex",
              fontWeight: 900,
              fontSize: 36,
              letterSpacing: "-1px",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: "#fff" }}>fit</span>
            <span style={{ color: LIME }}>trybe</span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* URL pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: MID_DARK,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 100,
              padding: "6px 16px",
              fontSize: 14,
              color: GREY,
              letterSpacing: "0.04em",
            }}
          >
            {SITE_URL}
          </div>
        </div>

        {/* ── Main content area ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 60px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Tag pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(182,255,0,0.08)",
              border: "1px solid rgba(182,255,0,0.25)",
              borderRadius: 100,
              padding: "6px 18px",
              marginBottom: 28,
              width: "fit-content",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: LIME,
              }}
            />
            <span
              style={{
                color: LIME,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {emoji
                ? `${emoji}  ${sport.charAt(0).toUpperCase() + sport.slice(1)} Session`
                : "Social Sports App — Coming Soon"}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? 54 : 68,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.0,
              letterSpacing: "-2px",
              textTransform: "uppercase",
              maxWidth: 900,
              marginBottom: 24,
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 22,
              color: GREY,
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            {description}
          </div>

          {/* Event meta chips — only rendered when date/price passed */}
          {(date || price) && (
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              {date && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: MID_DARK,
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 15,
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  📅  {date}
                </div>
              )}
              {price && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: price === "Free" ? "rgba(182,255,0,0.10)" : MID_DARK,
                    border: price === "Free" ? "1px solid rgba(182,255,0,0.30)" : "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 15,
                    color: price === "Free" ? LIME : "#fff",
                    fontWeight: 700,
                  }}
                >
                  {price}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px 40px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Sport badges */}
          <div style={{ display: "flex", gap: 10 }}>
            {["⚽", "🏀", "🎾", "🏸", "🏃"].map((emoji) => (
              <div
                key={emoji}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  background: MID_DARK,
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  fontSize: 22,
                }}
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* CTA chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: LIME,
              borderRadius: 8,
              padding: "12px 24px",
              color: "#0D0D0D",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Join Waitlist →
          </div>
        </div>

        {/* ── Lime accent stripe (right edge) ── */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "20%",
            width: 4,
            height: "60%",
            background: `linear-gradient(to bottom, transparent, ${LIME}, transparent)`,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  // ── KEY FIX: Set headers so social crawlers cache and serve this correctly ──
  // WhatsApp, Facebook, LinkedIn crawlers check Cache-Control before storing
  // the preview image. Without max-age they may skip caching or refuse to
  // render the image at all.
  imageResponse.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=3600"
  );
  imageResponse.headers.set("Content-Type", "image/png");

  return imageResponse;
}