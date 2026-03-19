"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function IconArrowLeft({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0D0D0D; color: #fff; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); overflow-x: hidden; min-height: 100vh; }
  body::before {
    content: ''; position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.02; pointer-events: none; z-index: 1000;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  @keyframes glowPulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  .waitlist-card { animation: fadeUp 0.6s ease forwards; }
  .shake { animation: shake 0.5s ease; }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #111 inset !important;
    -webkit-text-fill-color: #fff !important;
  }
  :focus-visible { outline: 2px solid #B6FF00; outline-offset: 3px; border-radius: 4px; }
`;

export default function WaitlistPageClient() {
  const router = useRouter();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [shake, setShake]     = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const snapshot = await getDocs(collection(db, "waitlist"));
        setWaitlistCount(snapshot.size);
      } catch { /* silently fail */ }
    }
    fetchCount();
  }, []);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim())                          { setError("Please enter your name.");             triggerShake(); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email address."); triggerShake(); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (res.status === 409) { setError("You're already on the list! 🎉"); setLoading(false); return; }
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); setLoading(false); return; }

      const newCount = waitlistCount !== null ? waitlistCount + 1 : null;
      const qs = new URLSearchParams({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        ...(newCount !== null ? { count: String(newCount) } : {}),
      });
      router.push(`/waitlist/success?${qs.toString()}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#111",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
    padding: "0.85rem 1rem", color: "#fff",
    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", fontSize: "0.95rem", outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(182,255,0,0.06) 0%, transparent 65%)", animation: "glowPulse 5s ease-in-out infinite" }} aria-hidden="true" />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(255,255,255,0.007) 60px, rgba(255,255,255,0.007) 62px)" }} aria-hidden="true" />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 5vw" }}>
        <Link href="/" aria-label="Back to Fittrybe homepage" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          color: "#4B5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.03em", transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
        >
          <IconArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      <main id="main-content" aria-label="Join Fittrybe waitlist" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 5vw 60px", position: "relative", zIndex: 1,
      }}>
        <div className="waitlist-card" style={{ width: "100%", maxWidth: 480 }}>

          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <Link href="/" style={{
              fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
              fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.02em", textDecoration: "none",
            }}>
              <span style={{ color: "#fff" }}>fit</span>
              <span style={{ color: "#B6FF00" }}>trybe</span>
            </Link>
          </div>

          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2, padding: "0.35rem 0.8rem", fontSize: "0.72rem", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1.25rem",
              }}>
                <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", display: "inline-block", animation: "blink 1.5s infinite" }} aria-hidden="true" />
                Launching 2026
              </div>

              <h1 style={{
                fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 900,
                fontSize: "clamp(2rem, 6vw, 3rem)", lineHeight: 1, letterSpacing: "-0.02em",
                textTransform: "uppercase", marginBottom: "0.75rem",
              }}>
                Get Early Access<br />to <span style={{ color: "#B6FF00" }}>Local Sports</span>
              </h1>
              <p style={{ fontSize: "0.92rem", color: "#6B7280", lineHeight: 1.6 }}>
                Be the first to discover real sports sessions near you when we launch in your city.{" "}
                {waitlistCount !== null && (
                  <strong style={{ color: "#B6FF00" }}>
                    {(waitlistCount + 100).toLocaleString()}+ already signed up.
                  </strong>
                )}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

              <div>
                <label htmlFor="waitlist-name" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.4rem" }}>
                  Full Name
                </label>
                <input
                  id="waitlist-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  autoComplete="name"
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)")}
                  onBlur={e =>  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="waitlist-email" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.4rem" }}>
                  Email Address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)")}
                  onBlur={e =>  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  aria-required="true"
                />
              </div>

              {error && (
                <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center", padding: "0.5rem 0" }}>
                  {error}
                </p>
              )}

              <button
                className={shake ? "shake" : ""}
                onClick={handleSubmit}
                disabled={loading}
                aria-label="Secure my spot on the Fittrybe waitlist"
                style={{
                  width: "100%", background: loading ? "rgba(182,255,0,0.6)" : "#B6FF00",
                  border: "none", borderRadius: 8, padding: "1rem",
                  fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                  fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "#0D0D0D",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "0.25rem", transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(182,255,0,0.25)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {loading ? "Joining..." : "Secure My Spot →"}
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#374151", marginTop: "1rem" }}>
              Free to join. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
