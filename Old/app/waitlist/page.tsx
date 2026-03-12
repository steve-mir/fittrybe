// app/waitlist/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function IconCheck({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconArrowLeft({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  // Fetch current count on mount
  useEffect(() => {
    async function fetchCount() {
      try {
        const snapshot = await getDocs(collection(db, "waitlist"));
        setWaitlistCount(snapshot.size);
      } catch {
        // silently fail
      }
    }
    fetchCount();
  }, []);

  const fireConfetti = async () => {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#B6FF00", "#ffffff", "#0D0D0D", "#6aff00"];

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors,
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
      });
    }, 250);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      triggerShake();
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      // Check if already registered
      const q = query(collection(db, "waitlist"), where("email", "==", email.toLowerCase().trim()));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("You're already on the list! 🎉");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "waitlist"), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      setWaitlistCount(prev => (prev !== null ? prev + 1 : null));
      await fireConfetti();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&family=DM+Sans:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #0D0D0D; color: #fff; font-family: 'Barlow', sans-serif; overflow-x: hidden; min-height: 100vh; }
    body::before {
      content: ''; position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.02; pointer-events: none; z-index: 1000;
    }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-6px); }
      80% { transform: translateX(6px); }
    }
    @keyframes glowPulse { 0%,100%{opacity:.5;} 50%{opacity:.9;} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
    .waitlist-card { animation: fadeUp 0.6s ease forwards; }
    .shake { animation: shake 0.5s ease; }
    .check-icon { animation: checkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 1000px #111 inset !important;
      -webkit-text-fill-color: #fff !important;
    }
    @media (max-width: 480px) {
      .form-row { flex-direction: column !important; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(182,255,0,0.06) 0%, transparent 65%)",
        animation: "glowPulse 5s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(255,255,255,0.007) 60px, rgba(255,255,255,0.007) 62px)",
      }} />

      {/* Back link */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 5vw" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          color: "#4B5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          letterSpacing: "0.03em", transition: "color 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
        >
          <IconArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Main content */}
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 5vw 60px", position: "relative", zIndex: 1,
      }}>
        <div className="waitlist-card" style={{ width: "100%", maxWidth: 480 }}>

          {/* Logo */}
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <Link href="/" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.02em", textDecoration: "none" }}>
              <span style={{ color: "#fff" }}>fit</span>
              <span style={{ color: "#B6FF00" }}>trybe</span>
            </Link>
          </div>

          {!submitted ? (
            <div style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "2.5rem",
            }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2, padding: "0.35rem 0.8rem", fontSize: "0.72rem", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "#B6FF00",
                  marginBottom: "1.25rem",
                }}>
                  <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", display: "inline-block", animation: "blink 1.5s infinite" }} />
                  Launching Soon
                </div>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                  fontSize: "clamp(2rem, 6vw, 3rem)", lineHeight: 1, letterSpacing: "-0.02em",
                  textTransform: "uppercase", marginBottom: "0.75rem",
                }}>
                  Join The <span style={{ color: "#B6FF00" }}>Waitlist</span>
                </h1>
                <p style={{ fontSize: "0.92rem", color: "#6B7280", lineHeight: 1.6 }}>
                  Be the first to play when we launch in your city.{" "}
                  {waitlistCount !== null && (
                    <span style={{ color: "#B6FF00", fontWeight: 600 }}>
                      {waitlistCount.toLocaleString()}+ already signed up.
                    </span>
                  )}
                </p>
              </div>

              {/* Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.4rem" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    style={{
                      width: "100%", background: "#111",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                      padding: "0.85rem 1rem", color: "#fff",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.4rem" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    style={{
                      width: "100%", background: "#111",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                      padding: "0.85rem 1rem", color: "#fff",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center", padding: "0.5rem 0" }}>{error}</p>
                )}

                <button
                  className={shake ? "shake" : ""}
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    width: "100%", background: loading ? "rgba(182,255,0,0.6)" : "#B6FF00",
                    border: "none", borderRadius: 8, padding: "1rem",
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem", fontWeight: 800,
                    letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D0D0D",
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
          ) : (
            /* Success state */
            <div style={{
              background: "#0a0a0a",
              border: "1px solid rgba(182,255,0,0.2)",
              borderRadius: 16, padding: "3rem 2.5rem",
              textAlign: "center",
            }}>
              <div className="check-icon" style={{
                width: 72, height: 72, background: "rgba(182,255,0,0.1)",
                border: "2px solid rgba(182,255,0,0.3)", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}>
                <IconCheck size={32} color="#B6FF00" />
              </div>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                fontSize: "clamp(1.8rem, 5vw, 2.5rem)", textTransform: "uppercase",
                letterSpacing: "-0.01em", marginBottom: "0.75rem",
              }}>
                You&apos;re <span style={{ color: "#B6FF00" }}>In!</span>
              </h2>
              <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
                Welcome to Fittrybe, <strong style={{ color: "#d1d5db" }}>{name}</strong>. 🎉
              </p>
              <p style={{ color: "#4B5563", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                We will send early access details to <strong style={{ color: "#9CA3AF" }}>{email}</strong> when we launch in your city.
              </p>
              {waitlistCount !== null && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.12)",
                  borderRadius: 100, padding: "0.5rem 1rem",
                  fontSize: "0.82rem", color: "#B6FF00", fontWeight: 600, marginBottom: "2rem",
                }}>
                  <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "blink 1.5s infinite" }} />
                  #{waitlistCount.toLocaleString()} on the waitlist
                </div>
              )}
              <Link href="/" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                color: "#4B5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
              >
                <IconArrowLeft size={14} /> Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}