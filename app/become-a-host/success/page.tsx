/**
 * /become-a-host/success — landing page after Stripe Checkout completes.
 *
 * The actual database mutation (profiles.is_verified = true, etc.) is performed
 * server-side by /api/become-a-host/webhook against Stripe's signed events.
 * This page is purely confirmation UI; we don't trust the redirect itself.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = {
  title: "Welcome, Host — Fittrybe",
  description: "Your verified-host subscription is active.",
  robots: { index: false, follow: false },
};

const PAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050505; color: #fff; font-family: var(--font-inter-tight, 'Inter Tight', sans-serif); min-height: 100vh; overflow-x: hidden; }

  @keyframes bahFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bahPop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
  @keyframes bahGlow { 0%,100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); } }

  .bah-fade { animation: bahFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-1 { animation: bahFadeUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-2 { animation: bahFadeUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-3 { animation: bahFadeUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-pop { animation: bahPop 0.7s 0.05s cubic-bezier(0.34,1.56,0.64,1) both; }

  .bah-cta {
    background: #B6FF00; color: #0D0D0D; border: none;
    border-radius: 10px; padding: 0.95rem 1.6rem;
    font-family: var(--font-anton, 'Anton', sans-serif);
    font-size: 1rem; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .bah-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(182,255,0,0.28); }

  .bah-ghost {
    background: transparent; color: #9CA3AF;
    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    padding: 0.85rem 1.5rem; font-size: 0.88rem; font-weight: 500;
    text-decoration: none; transition: border-color 0.2s, color 0.2s;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .bah-ghost:hover { border-color: rgba(255,255,255,0.25); color: #fff; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function BecomeAHostSuccessPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, zIndex: 10,
          padding: "1.25rem 5vw",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(5,5,5,0.7)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Link
          href="/"
          aria-label="Fittrybe — return to homepage"
          style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" }}
        >
          <Image src="/logo-mark.png" alt="" width={28} height={28} priority style={{ display: "block" }} />
          <Wordmark height={22} />
        </Link>
      </header>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 5vw 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 700, height: 700,
            background: "radial-gradient(circle, rgba(182,255,0,0.1) 0%, transparent 70%)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            animation: "bahGlow 5s ease-in-out infinite",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 540 }}>
          <div
            className="bah-pop"
            aria-hidden="true"
            style={{
              width: 96, height: 96,
              borderRadius: "50%",
              background: "#B6FF00",
              color: "#0D0D0D",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2rem",
              boxShadow: "0 0 0 14px rgba(182,255,0,0.08), 0 30px 80px rgba(182,255,0,0.18)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <p
            className="bah-fade"
            style={{
              color: "#B6FF00",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Subscription Active
          </p>

          <h1
            className="bah-fade-1"
            style={{
              fontFamily: "var(--font-anton, 'Anton', sans-serif)",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 7vw, 4rem)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            Welcome to <span style={{ color: "#B6FF00" }}>the trybe.</span>
          </h1>

          <p
            className="bah-fade-2"
            style={{
              fontSize: "1rem",
              color: "#9CA3AF",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            Your verified-host subscription is live. Open the Fittrybe app to
            create your first session — your verified badge will appear next to
            your name automatically.
          </p>

          <div
            className="bah-fade-3"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <Link href="/" className="bah-cta" aria-label="Back to Fittrybe homepage">
              Back to home
            </Link>
            <Link href="/events" className="bah-ghost" aria-label="Browse upcoming sessions">
              Browse sessions
            </Link>
          </div>

          <p
            style={{
              marginTop: "2.5rem",
              fontSize: "0.78rem",
              color: "#4B5563",
              lineHeight: 1.6,
            }}
          >
            A receipt has been emailed to you. You can manage or cancel your
            subscription anytime from your account.
          </p>
        </div>
      </main>
    </>
  );
}
