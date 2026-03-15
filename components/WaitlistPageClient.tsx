/**
 * ─── Fittrybe — Waitlist Page Client Component ───────────────────────────────
 *
 * Changes vs previous version:
 *  • Location text input added (after email)
 *  • "I want to organise games" toggle card added (after sports grid)
 *  • Both fields sent in POST /api/waitlist payload
 *  • Success screen shows location + organiser status
 */
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

/* ─── Icons ─────────────────────────────────────────────────────────────────── */

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
function IconMapPin({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function IconWhistle({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="12" r="5" />
      <path d="M14 12h7" />
      <path d="M18 9l3-3" />
      <path d="M6 8l2-3" />
    </svg>
  );
}

/* ─── Sports options ─────────────────────────────────────────────────────────── */

const SPORTS = [
  { id: "football",    label: "Football",    emoji: "⚽" },
  { id: "basketball",  label: "Basketball",  emoji: "🏀" },
  { id: "tennis",      label: "Tennis",      emoji: "🎾" },
  { id: "running",     label: "Running",     emoji: "🏃" },
  { id: "volleyball",  label: "Volleyball",  emoji: "🏐" },
  { id: "swimming",    label: "Swimming",    emoji: "🏊" },
  { id: "cycling",     label: "Cycling",     emoji: "🚴" },
  { id: "badminton",   label: "Badminton",   emoji: "🏸" },
  { id: "tabletennis", label: "Table Tennis",emoji: "🏓" },
  { id: "other",       label: "Other",       emoji: "🏅" },
];

/* ─── Global styles ──────────────────────────────────────────────────────────── */

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
  @keyframes organiserGlow { 0%,100%{box-shadow:0 0 0 0 rgba(182,255,0,0)} 50%{box-shadow:0 0 16px 2px rgba(182,255,0,0.12)} }
  .waitlist-card { animation: fadeUp 0.6s ease forwards; }
  .shake { animation: shake 0.5s ease; }
  .check-icon { animation: checkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #111 inset !important;
    -webkit-text-fill-color: #fff !important;
  }
  :focus-visible { outline: 2px solid #B6FF00; outline-offset: 3px; border-radius: 4px; }

  /* ── Sport checkbox grid ── */
  .sports-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  .sport-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
    background: #111;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    user-select: none;
  }
  .sport-option:hover {
    border-color: rgba(182,255,0,0.3);
    background: rgba(182,255,0,0.04);
  }
  .sport-option.selected {
    border-color: rgba(182,255,0,0.55);
    background: rgba(182,255,0,0.07);
  }
  .sport-checkbox {
    width: 16px; height: 16px; flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.18s, background 0.18s;
  }
  .sport-option.selected .sport-checkbox {
    background: #B6FF00;
    border-color: #B6FF00;
  }
  .sport-emoji { font-size: 1rem; line-height: 1; }
  .sport-label { font-size: 0.82rem; font-weight: 600; color: #d1d5db; }
  .sport-option.selected .sport-label { color: #fff; }

  /* ── Location input wrapper ── */
  .location-wrapper {
    position: relative;
  }
  .location-wrapper .pin-icon {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #4B5563;
    transition: color 0.2s;
  }
  .location-wrapper:focus-within .pin-icon {
    color: #B6FF00;
  }
  .location-input {
    padding-left: 2.5rem !important;
  }

  /* ── Organiser toggle card ── */
  .organiser-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1rem;
    background: #111;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    user-select: none;
  }
  .organiser-card:hover {
    border-color: rgba(182,255,0,0.25);
    background: rgba(182,255,0,0.03);
  }
  .organiser-card.active {
    border-color: rgba(182,255,0,0.5);
    background: rgba(182,255,0,0.06);
    animation: organiserGlow 2s ease-in-out infinite;
  }
  .organiser-icon-wrap {
    width: 38px; height: 38px; flex-shrink: 0;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    transition: background 0.2s, border-color 0.2s;
  }
  .organiser-card.active .organiser-icon-wrap {
    background: rgba(182,255,0,0.12);
    border-color: rgba(182,255,0,0.3);
  }
  .organiser-text { flex: 1; }
  .organiser-title {
    font-size: 0.88rem; font-weight: 700; color: #d1d5db;
    line-height: 1.2; margin-bottom: 0.18rem;
  }
  .organiser-card.active .organiser-title { color: #fff; }
  .organiser-sub {
    font-size: 0.74rem; color: #4B5563; line-height: 1.4;
  }
  .organiser-card.active .organiser-sub { color: #6B7280; }
  /* pill toggle */
  .toggle-pill {
    width: 36px; height: 20px; flex-shrink: 0;
    border-radius: 100px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    position: relative;
    transition: background 0.2s, border-color 0.2s;
  }
  .organiser-card.active .toggle-pill {
    background: #B6FF00;
    border-color: #B6FF00;
  }
  .toggle-thumb {
    position: absolute;
    top: 2px; left: 2px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0.3;
  }
  .organiser-card.active .toggle-thumb {
    transform: translateX(16px);
    opacity: 1;
  }
`;

/* ─── Component ──────────────────────────────────────────────────────────────── */

export default function WaitlistPageClient() {
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [location, setLocation]         = useState("");
  const [sports, setSports]             = useState<string[]>([]);
  const [wantsToOrganise, setWantsToOrganise] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [shake, setShake]               = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  /* Fetch count on mount */
  useEffect(() => {
    async function fetchCount() {
      try {
        const snapshot = await getDocs(collection(db, "waitlist"));
        setWaitlistCount(snapshot.size);
      } catch { /* silently fail */ }
    }
    fetchCount();
  }, []);

  /* Confetti */
  const fireConfetti = async () => {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#B6FF00", "#ffffff", "#0D0D0D", "#6aff00"];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors });
    }, 250);
  };

  /* Toggle a sport on/off */
  const toggleSport = (id: string) => {
    setSports(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  /* Submit */
  const handleSubmit = async () => {
    setError(null);

    if (!name.trim())                          { setError("Please enter your name.");               triggerShake(); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email address.");   triggerShake(); return; }
    if (!location.trim())                      { setError("Please enter your city or location.");   triggerShake(); return; }
    if (sports.length === 0)                   { setError("Please select at least one sport.");     triggerShake(); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           name.trim(),
          email:          email.toLowerCase().trim(),
          location:       location.trim(),
          sports:         sports.map(id => SPORTS.find(s => s.id === id)?.label ?? id),
          wantsToOrganise,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError("You're already on the list! 🎉");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

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

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#111",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
    padding: "0.85rem 1rem", color: "#fff",
    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", fontSize: "0.95rem", outline: "none",
    transition: "border-color 0.2s",
  };

  const selectedSportLabels = sports.map(id => SPORTS.find(s => s.id === id)?.label ?? id);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* Background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(182,255,0,0.06) 0%, transparent 65%)", animation: "glowPulse 5s ease-in-out infinite" }} aria-hidden="true" />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(255,255,255,0.007) 60px, rgba(255,255,255,0.007) 62px)" }} aria-hidden="true" />

      {/* Back nav */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 5vw" }}>
        <Link href="/" aria-label="Back to Fittrybe homepage — discover local sports sessions" style={{
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

          {/* Logo */}
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <Link href="/" aria-label="Fittrybe — find local sports sessions near you" style={{
              fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
              fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.02em", textDecoration: "none",
            }}>
              <span style={{ color: "#fff" }}>fit</span>
              <span style={{ color: "#B6FF00" }}>trybe</span>
            </Link>
          </div>

          {!submitted ? (
            /* ── FORM ─────────────────────────────────────────────────────────── */
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

                {/* Name */}
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

                {/* Email */}
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

                {/* ── Location (NEW) ── */}
                <div>
                  <label htmlFor="waitlist-location" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.4rem" }}>
                    Your City / Location
                  </label>
                  <div className="location-wrapper">
                    <span className="pin-icon">
                      <IconMapPin size={15} />
                    </span>
                    <input
                      id="waitlist-location"
                      type="text"
                      placeholder="e.g. Birmingham, Liverpool, London…"
                      value={location}
                      autoComplete="address-level2"
                      onChange={e => setLocation(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      className="location-input"
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)")}
                      onBlur={e =>  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Sports */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.6rem" }}>
                    Sports You Play
                    <span style={{ color: "#374151", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "0.4rem", fontSize: "0.72rem" }}>
                      (select all that apply)
                    </span>
                  </label>
                  <div className="sports-grid" role="group" aria-label="Sports selection">
                    {SPORTS.map(sport => {
                      const isSelected = sports.includes(sport.id);
                      return (
                        <div
                          key={sport.id}
                          className={`sport-option${isSelected ? " selected" : ""}`}
                          onClick={() => toggleSport(sport.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={e => (e.key === " " || e.key === "Enter") && toggleSport(sport.id)}
                        >
                          <div className="sport-checkbox">
                            {isSelected && <IconCheck size={10} color="#0D0D0D" />}
                          </div>
                          <span className="sport-emoji" aria-hidden="true">{sport.emoji}</span>
                          <span className="sport-label">{sport.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Organiser toggle (NEW) ── */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#4B5563", marginBottom: "0.6rem" }}>
                    Your Role
                  </label>
                  <div
                    className={`organiser-card${wantsToOrganise ? " active" : ""}`}
                    onClick={() => setWantsToOrganise(prev => !prev)}
                    role="switch"
                    aria-checked={wantsToOrganise}
                    tabIndex={0}
                    onKeyDown={e => (e.key === " " || e.key === "Enter") && setWantsToOrganise(prev => !prev)}
                    aria-label="I want to organise games"
                  >
                    <div className="organiser-icon-wrap">
                      <IconWhistle size={18} color={wantsToOrganise ? "#B6FF00" : "#6B7280"} />
                    </div>
                    <div className="organiser-text">
                      <div className="organiser-title">I want to organise games</div>
                      <div className="organiser-sub">
                        {wantsToOrganise
                          ? "Great — we'll reach out with early organiser perks 🎉"
                          : "Toggle on if you'd like to host sessions in your area"}
                      </div>
                    </div>
                    <div className="toggle-pill" aria-hidden="true">
                      <div className="toggle-thumb" />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center", padding: "0.5rem 0" }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
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

          ) : (
            /* ── SUCCESS ──────────────────────────────────────────────────────── */
            <div style={{ background: "#0a0a0a", border: "1px solid rgba(182,255,0,0.2)", borderRadius: 16, padding: "3rem 2.5rem", textAlign: "center" }}>
              <div className="check-icon" style={{ width: 72, height: 72, background: "rgba(182,255,0,0.1)", border: "2px solid rgba(182,255,0,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <IconCheck size={32} color="#B6FF00" />
              </div>
              <h1 style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 900, fontSize: "clamp(1.8rem, 5vw, 2.5rem)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.75rem" }}>
                You&apos;re <span style={{ color: "#B6FF00" }}>In!</span>
              </h1>
              <p style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
                Welcome to Fittrybe, <strong style={{ color: "#d1d5db" }}>{name}</strong>. 🎉
              </p>
              <p style={{ color: "#4B5563", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                We&apos;ll send early access details to <strong style={{ color: "#9CA3AF" }}>{email}</strong> when we launch local sports sessions in your city.
              </p>

              {/* Location recap */}
              {location && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#6B7280", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  <IconMapPin size={13} color="#4B5563" />
                  <span>{location}</span>
                </div>
              )}

              {/* Organiser badge */}
              {wantsToOrganise && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.25)",
                  borderRadius: 8, padding: "0.5rem 0.9rem", fontSize: "0.8rem",
                  color: "#B6FF00", fontWeight: 700, marginBottom: "1rem",
                  marginLeft: location ? "0.75rem" : 0,
                }}>
                  <IconWhistle size={14} color="#B6FF00" />
                  Organiser — we&apos;ll be in touch
                </div>
              )}

              {/* Sports recap */}
              {selectedSportLabels.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center", marginBottom: "1.5rem", marginTop: "0.5rem" }}>
                  {selectedSportLabels.map(label => (
                    <span key={label} style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.18)", borderRadius: 100, padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, color: "#B6FF00" }}>
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ color: "#374151", fontSize: "0.8rem", marginBottom: "1.75rem" }}>
                📬 A confirmation email is on its way to your inbox.
              </p>

              {waitlistCount !== null && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.12)", borderRadius: 100, padding: "0.5rem 1rem", fontSize: "0.82rem", color: "#B6FF00", fontWeight: 600, marginBottom: "2rem" }}>
                  <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "blink 1.5s infinite" }} aria-hidden="true" />
                  #{(waitlistCount + 100).toLocaleString()} on the waitlist
                </div>
              )}

              <br />
              <Link href="/" aria-label="Back to Fittrybe homepage — discover local sports sessions near you" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#4B5563", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#9CA3AF")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
              >
                <IconArrowLeft size={14} /> Explore the Fittrybe App
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}