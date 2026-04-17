"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function IconCheck({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconArrowLeft({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0D0D0D; color: #fff; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); min-height: 100vh; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes glowPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
  .success-card { animation: fadeUp 0.6s ease forwards; }
  .check-icon { animation: checkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
`;

export default function WaitlistSuccessClient() {
  const params = useSearchParams();
  const name  = params.get("name") ?? "";
  const email = params.get("email") ?? "";
  const count = params.get("count") ? Number(params.get("count")) : null;

  useEffect(() => {
    // Lead event tracking moved to server-side CAPI in /api/waitlist
    // This page now only handles visual celebration
    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      const colors = ["#B6FF00", "#ffffff", "#0D0D0D", "#6aff00"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors });
      }, 250);
    })();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(182,255,0,0.06) 0%, transparent 65%)", animation: "glowPulse 5s ease-in-out infinite" }} aria-hidden="true" />

      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 5vw", position: "relative", zIndex: 1 }}>
        <div className="success-card" style={{ width: "100%", maxWidth: 480 }}>

          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <Link href="/" style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.02em", textDecoration: "none" }}>
              <span style={{ color: "#fff" }}>fit</span>
              <span style={{ color: "#B6FF00" }}>trybe</span>
            </Link>
          </div>

          <div style={{ background: "#0a0a0a", border: "1px solid rgba(182,255,0,0.2)", borderRadius: 16, padding: "3rem 2.5rem", textAlign: "center" }}>

            <div className="check-icon" style={{ width: 72, height: 72, background: "rgba(182,255,0,0.1)", border: "2px solid rgba(182,255,0,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <IconCheck size={32} color="#B6FF00" />
            </div>

            <h1 style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 900, fontSize: "clamp(1.8rem, 5vw, 2.5rem)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.75rem" }}>
              You&apos;re <span style={{ color: "#B6FF00" }}>In!</span>
            </h1>

            <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
              Welcome to Fittrybe{name && <>, <strong style={{ color: "#d1d5db" }}>{name}</strong></>}. 🎉
            </p>

            {email && (
              <p style={{ color: "#4B5563", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                We&apos;ll send early access details to <strong style={{ color: "#9CA3AF" }}>{email}</strong> when we launch local sports sessions in your city.
              </p>
            )}

            <p style={{ color: "#374151", fontSize: "0.8rem", marginBottom: "1.75rem" }}>
              📬 A confirmation email is on its way to your inbox.
            </p>

            {count !== null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.12)", borderRadius: 100, padding: "0.5rem 1rem", fontSize: "0.82rem", color: "#B6FF00", fontWeight: 600, marginBottom: "2rem" }}>
                <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "blink 1.5s infinite" }} aria-hidden="true" />
                #{(count + 100).toLocaleString()} on the waitlist
              </div>
            )}

            <br />
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#4B5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
            >
              <IconArrowLeft size={14} /> Explore the Fittrybe App
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
