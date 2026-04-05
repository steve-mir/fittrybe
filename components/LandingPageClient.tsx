/**
 * ─── Fittrybe — Landing Page Client Component ────────────────────────────────
 *
 * All original UI preserved.
 * SEO improvements applied:
 *  • @import removed → CSS variables from next/font used instead
 *  • All inline <img> → next/image with alt, sizes, priority
 *  • Semantic HTML5 tags (<main>, <section aria-label="">, <header>, <footer>)
 *  • Heading hierarchy enforced: H1 hero, H2 sections, H3 cards
 *  • FAQ section added (visible, answers common questions for AI engines)
 *  • Anchor text on all CTAs is keyword-rich (not generic "click here")
 *  • All interactive elements have aria-label
 *  • Videos have aria-label + track placeholder for accessibility
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconArrowRight({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconApple({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}
function IconGooglePlay({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
    </svg>
  );
}
function IconTwitterX({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.988l4.26 5.633 5.746-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function IconInstagram({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color}/>
    </svg>
  );
}
function IconTiktok({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.53V6.77a4.85 4.85 0 01-1-.08z"/>
    </svg>
  );
}

function IconFacebook({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M9.5 3v3.5H7V10h2.5v9h4v-9h3.5V6.5H13.5V4c0-.6.4-1 1-1h3V0h-4C10.8 0 9.5 1.3 9.5 3z"/>
    </svg>
  );
}

function IconChevronDown({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── CSS (font variables injected by next/font in layout) ────────────────────
const globalStyles = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #050505; color: #fff; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); overflow-x: hidden; }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-18px) rotate(5deg); }
    66% { transform: translateY(8px) rotate(-3deg); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
    0% { transform: rotateX(-90deg) translateY(8px); opacity: 0; }
    100% { transform: rotateX(0deg) translateY(0px); opacity: 1; }
  }
  @keyframes flipOut {
    0% { transform: rotateX(0deg) translateY(0px); opacity: 1; }
    100% { transform: rotateX(90deg) translateY(-8px); opacity: 0; }
  }
  .flip-word-enter {
    animation: flipIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .flip-word-exit {
    animation: flipOut 0.35s cubic-bezier(0.55, 0, 1, 0.45) forwards;
  }

  .bento-card {
    border-radius: 20px; background: #0D0D0D;
    border: 1px solid rgba(255,255,255,0.07); overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .bento-card:hover {
    transform: scale(1.025) translateY(-4px);
    border-color: rgba(182,255,0,0.3);
    box-shadow: 0 0 40px rgba(182,255,0,0.08), 0 20px 60px rgba(0,0,0,0.5);
  }
  .sport-icon-float {
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 14px; border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03); font-size: 2rem;
    transition: transform 0.3s ease, border-color 0.3s ease;
  }
  .sport-icon-float:hover { border-color: rgba(182,255,0,0.4); transform: scale(1.15) rotate(-3deg); }
  .social-icon-btn {
    width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
    border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
    color: #6B7280; transition: color 0.2s, border-color 0.2s, background 0.2s; text-decoration: none;
  }
  .social-icon-btn:hover { color: #B6FF00; border-color: rgba(182,255,0,0.3); background: rgba(182,255,0,0.05); }
  .footer-link {
    color: #4B5563; text-decoration: none; font-size: 0.8rem; font-weight: 500;
    letter-spacing: 0.05em; transition: color 0.2s;
  }
  .footer-link:hover { color: #9CA3AF; }
  .store-btn {
    display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px;
    border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04); cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    text-decoration: none; color: #fff;
  }
  .store-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
  .faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .faq-item:last-child { border-bottom: none; }

  @media (max-width: 1024px) {
    .hero-section {
      grid-template-columns: 1fr !important;
      padding: 120px 6vw 80px !important;
      text-align: center;
      justify-items: center;
      gap: 3rem !important;
    }
    .hero-copy { display: flex !important; flex-direction: column !important; align-items: center !important; }
    .hero-buttons { justify-content: center !important; }
    .hero-phones { display: flex !important; min-height: 520px !important; }
    .bento-grid { grid-template-columns: 1fr 1fr !important; }
    .bento-grid > *:first-child { grid-column: 1 / -1 !important; grid-row: auto !important; min-height: 280px !important; flex-direction: row !important; align-items: center !important; }
  }
  @media (max-width: 768px) {
    .hero-section {
      padding: 90px 5vw 60px !important;
      min-height: 100svh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 2rem !important;
    }
    .hero-phones { min-height: 400px !important; }
    .hero-phones > div { transform: none !important; }
    .bento-grid { grid-template-columns: 1fr !important; }
    .bento-grid > * { grid-column: 1 / -1 !important; grid-row: auto !important; }
    .footer-inner { flex-direction: column !important; align-items: flex-start !important; gap: 1.5rem !important; }

  /* ── Sticky scroll: mobile stacked layout ── */
  .sticky-inner {
    flex-direction: column !important;
    height: 100vh !important;
    padding: 80px 5vw 60px !important;
    gap: 0 !important;
    justify-content: flex-start !important;
    overflow: hidden !important;
    align-items: center !important;
  }
  .sticky-right {
    flex: none !important;
    width: 100% !important;
    height: 45% !important;
    justify-content: center !important;
    align-items: center !important;
    order: 1 !important;
  }
    .sticky-left {
    flex: none !important;
    width: 100% !important;
    height: 55% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important; /* Change this from flex-start to center */
    padding-top: 1.5rem !important;
    order: 2 !important;
    position: relative !important;
  }
  
  /* Add this new rule to center the content containers */
  .sticky-left > div {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    left: 0 !important;
    right: 0 !important;
    padding: 0 5vw !important; /* Add some padding on the sides */
    text-align: center !important;
  }
  
  /* Center the paragraph text */
  .sticky-left p {
    text-align: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .sticky-phone-outer { width: 160px !important; height: 330px !important; border-radius: 36px !important; }
  .sticky-phone-inner { border-radius: 34px !important; }
  .sticky-di { width: 80px !important; height: 26px !important; top: 10px !important; }
}
  @media (max-width: 480px) {
    .hero-section { padding: 80px 4vw 50px !important; }
    .hero-phones { min-height: 360px !important; }
    .store-btn { padding: 10px 14px !important; }
    .bento-grid { gap: 10px !important; }
  }
`;

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      role="navigation"
      aria-label="Main navigation"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 5vw", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease",
      }}
    >
      <Link href="/" aria-label="Fittrybe — return to homepage" style={{
        fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
        fontWeight: 900, fontSize: "1.7rem", letterSpacing: "-0.02em", textDecoration: "none",
      }}>
        <span style={{ color: "#fff" }}>fit</span>
        <span style={{ color: "#B6FF00" }}>trybe</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link href="/blog" aria-label="Read the Fittrybe blog" style={{
          color: "#9CA3AF",
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
          fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.07em",
          textTransform: "uppercase", textDecoration: "none",
          transition: "color 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#9CA3AF"; }}
        >Blog</Link>

      <a href="/waitlist" aria-label="Join the Fittrybe waitlist for early access" style={{
        background: "#B6FF00", color: "#0D0D0D",
        padding: "0.45rem 1.3rem", borderRadius: 6,
        fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
        fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.07em",
        textTransform: "uppercase", textDecoration: "none",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(182,255,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
      >Join Waitlist</a>
      </div>
    </motion.nav>
  );
}

// ─── Safari-safe autoplay video component ─────────────────────────────────────
function HeroPhoneVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    const tryPlay = () => {
      const p = v.play();
      if (p !== undefined) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
    };
    if (v.readyState >= 2) { tryPlay(); }
    else { v.addEventListener("loadeddata", tryPlay, { once: true }); }
    return () => v.removeEventListener("loadeddata", tryPlay);
  }, []);
  return (
    <video
      ref={videoRef}
      autoPlay muted loop playsInline
      aria-label="Fittrybe app preview showing local sports sessions"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
      webkit-playsinline="true"
    >
      <source src="/videos/mockup.mp4" type="video/mp4" />
      <track kind="captions" />
    </video>
  );
}

// ─── 1. HERO ──────────────────────────────────────────────────────────────────
function HeroSection() {
  const [flipWord, setFlipWord] = useState<"game" | "trybe">("game");
  const [flipping, setFlipping] = useState(false);
  const [displayed, setDisplayed] = useState<"game" | "trybe">("game");

  useEffect(() => {
    const interval = setInterval(() => {
      setFlipping(true);
      setTimeout(() => {
        setDisplayed(prev => prev === "game" ? "trybe" : "game");
        setFlipWord(prev => prev === "game" ? "trybe" : "game");
        setFlipping(false);
      }, 350);
    }, 2800) as unknown as number;
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      aria-label="Hero — Find your local sports game"
      style={{
        minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center", padding: "140px 5vw 100px", gap: "4rem",
        position: "relative", overflow: "hidden",
      }}
      className="hero-section"
    >
      {/* Background Video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <video
          autoPlay muted loop playsInline
          aria-label="Sports action background video"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            opacity: 0.18, filter: "saturate(0.4) brightness(0.7)",
          }}
          ref={el => { if (el) { el.muted = true; el.play().catch(() => {}); } }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
          <track kind="captions" />
        </video>
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0.65) 75%, rgba(5,5,5,0.95) 100%), linear-gradient(to right, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.0) 60%)`,
        }} />
      </div>
      <div style={{
        position: "absolute", width: 600, height: 600,
        background: "radial-gradient(circle, rgba(182,255,0,0.05) 0%, transparent 70%)",
        top: "50%", left: "30%", transform: "translate(-50%, -50%)", pointerEvents: "none",
        animation: "glowPulse 4s ease-in-out infinite", zIndex: 1,
      }} />

      {/* Left copy */}
      <div className="hero-copy" style={{ position: "relative", zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.2)",
            borderRadius: 100, padding: "6px 16px", marginBottom: "1.5rem",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#B6FF00",
          }}
        >
          <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "blink 1.5s infinite" }} aria-hidden="true" />
          Coming Soon — Be First To Play
        </motion.div>

        {/* ── H1: Primary keyword target ── */}
        <h1 style={{
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontWeight: 900,
          fontSize: "clamp(3.5rem, 7vw, 6.5rem)", lineHeight: 0.92,
          letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: "1.5rem",
        }}>
          {["Find", "Your"].map((word, i) => (
            <div key={word} style={{ overflow: "hidden", lineHeight: 0.95 }}>
              <motion.span
                initial={{ y: "110%" }} animate={{ y: 0 }}
                transition={{ delay: 0.35 + i * 0.14, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "block", color: i === 1 ? "#B6FF00" : "#fff" }}
              >{word}</motion.span>
            </div>
          ))}
          {/* Flipping word: game ↔ trybe */}
          <div style={{ overflow: "hidden", lineHeight: 0.95, perspective: "400px" }}>
            <motion.span
              initial={{ y: "110%" }} animate={{ y: 0 }}
              transition={{ delay: 0.63, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "block" }}
            >
              <span
                key={displayed}
                className={flipping ? "flip-word-exit" : "flip-word-enter"}
                style={{
                  display: "inline-block",
                  color: "#fff",
                  transformOrigin: "50% 50%",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >{displayed}.</span>
            </motion.span>
          </div>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          style={{ fontSize: "1.05rem", color: "#6B7280", lineHeight: 1.7, maxWidth: 420, marginBottom: "2.5rem" }}
        >
          Discover real sports sessions near you. Join a game, meet people worth playing with, and build a routine that sticks. Football, basketball, tennis, badminton — all in one app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="hero-buttons"
          style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
        >
          <a href="/waitlist" aria-label="Join the Fittrybe waitlist and get early access to local sports sessions" style={{
            background: "#B6FF00", color: "#0D0D0D", padding: "0.85rem 2rem",
            borderRadius: 8, fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
            fontSize: "1rem", fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(182,255,0,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >Get Early Access <IconArrowRight size={16} color="#0D0D0D" /></a>

          <a href="#how-it-works" aria-label="Learn how Fittrybe works" style={{
            color: "#9CA3AF", padding: "0.85rem 2rem",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
            fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
            fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            transition: "border-color 0.2s, color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#9CA3AF"; }}
          >▶ How It Works</a>
        </motion.div>
      </div>

      {/* Right — iPhone 17 Orange Phone Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="hero-phones"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2, minHeight: 600 }}
      >
        {/* Ambient glow matching phone color */}
        <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, rgba(255,95,31,0.18) 0%, rgba(182,255,0,0.06) 50%, transparent 70%)", filter: "blur(60px)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 3, transform: "rotateY(-9deg) rotateX(4deg)", transformStyle: "preserve-3d" }}>
          {/* Phone outer shell — iPhone 17 Orange titanium frame */}
          <div style={{
            width: 290, height: 610,
            borderRadius: 52,
            background: "linear-gradient(145deg, #FF6B1A 0%, #E8450A 35%, #C93B08 65%, #FF7A2A 100%)",
            padding: "3px",
            boxShadow: `
              0 0 0 1px rgba(255,120,50,0.6),
              0 2px 4px rgba(255,100,30,0.4),
              6px 6px 20px rgba(0,0,0,0.7),
              -2px -2px 10px rgba(255,140,60,0.25),
              0 40px 100px rgba(0,0,0,0.85),
              0 80px 160px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,200,150,0.5),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
            position: "relative",
          }}>
            {/* Side buttons — volume */}
            <div style={{ position: "absolute", left: -3, top: 110, width: 3, height: 36, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", left: -3, top: 158, width: 3, height: 36, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            {/* Side button — mute/action */}
            <div style={{ position: "absolute", left: -3, top: 72, width: 3, height: 26, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            {/* Side button — power */}
            <div style={{ position: "absolute", right: -3, top: 130, width: 3, height: 50, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "0 2px 2px 0", boxShadow: "1px 0 3px rgba(0,0,0,0.4)" }} />

            {/* Inner screen bezel */}
            <div style={{
              width: "100%", height: "100%",
              borderRadius: 50,
              background: "#080808",
              overflow: "hidden",
              position: "relative",
              // ✅ Add these two Safari fixes:
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              transform: "translateZ(0)",
            }}>
              {/* Dynamic Island */}
              {/* <div style={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                width: 110, height: 34,
                background: "#000",
                borderRadius: 20,
                zIndex: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              * Camera dot *
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "#0a0a0a" }} />
                  <div style={{ position: "absolute", top: 2, left: 2, width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                </div>
                * Face ID line *
                <div style={{ width: 40, height: 3, background: "#1a1a1a", borderRadius: 2 }} />
              </div> */}

              {/* App video */}
              <HeroPhoneVideo />

              {/* Screen edge gloss */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)", pointerEvents: "none", zIndex: 10, borderRadius: 50 }} />

              {/* Home indicator */}
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 100, height: 4, background: "rgba(255,255,255,0.35)", borderRadius: 4, zIndex: 15 }} aria-hidden="true" />
            </div>
          </div>

          {/* Reflection under phone */}
          <div style={{
            position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 60,
            background: "radial-gradient(ellipse, rgba(255,95,31,0.25) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }} />
        </div>
      </motion.div>
    </section>
  );
}

// ─── 2. HOW IT WORKS (Sticky Scroll) ─────────────────────────────────────────
const SCROLL_SLIDES = [
  { label: "01", word: "EXPLORE", sub: "Find sports sessions near you", img: "/images/explore.jpg", desc: "Browse live local sessions by sport, distance, and time. See who's playing, where, and when." },
  { label: "02", word: "CONNECT", sub: "Meet your local sports tribe", img: "/images/connect.jpg", desc: "Chat with players, build your network, and find people who share your playing style and schedule." },
  { label: "03", word: "PLAY", sub: "Show up and stay active", img: "/images/play.jpg", desc: "Reserve your spot, show up, play sport, and build the active routine you've always wanted." },
];

function StickyScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const [activeSlide, setActiveSlide] = useState(0);

  // Fix: no conditional hooks — define all three upfront with correct ranges
  // Slide 0: starts fully visible (opacity 1 at progress=0), fades out at 0.25–0.38
  const opacity0 = useTransform(scrollYProgress, [0, 0, 0.25, 0.38], [1, 1, 1, 0]);
  // Slide 1: fades in at 0.28–0.38, fades out at 0.62–0.72
  const opacity1 = useTransform(scrollYProgress, [0.28, 0.38, 0.62, 0.72], [0, 1, 1, 0]);
  // Slide 2: fades in at 0.62–0.72, stays fully visible through end (opacity 1 at progress=1)
  const opacity2 = useTransform(scrollYProgress, [0.62, 0.72, 1, 1], [0, 1, 1, 1]);
  const opacities = [opacity0, opacity1, opacity2];

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.38) setActiveSlide(0);
    else if (v < 0.72) setActiveSlide(1);
    else setActiveSlide(2);
  });

  return (
    <section
      id="how-it-works"
      aria-label="How Fittrybe works — explore, connect, play"
      ref={containerRef}
      style={{ height: "300vh", position: "relative" }}
    >
      <div
        className="sticky-inner"
        style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "#050505" }}
      >
        {/* Left */}
        <div className="sticky-left" style={{ position: "relative", flex: "0 0 50%", paddingLeft: "5vw", height: "100%", display: "flex", alignItems: "center" }}>
          {SCROLL_SLIDES.map((slide, i) => (
            <motion.div key={slide.label} style={{ opacity: opacities[i], position: "absolute", pointerEvents: "none" }}>
              {/* H2 for each section */}
              <h2 style={{
                fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                fontWeight: 900, fontSize: "clamp(4rem, 10vw, 9rem)",
                lineHeight: 0.88, textTransform: "uppercase", letterSpacing: "-0.03em", color: "#fff",
              }}>
                <span style={{ display: "block", fontSize: "0.32em", color: "#B6FF00", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>{slide.label}</span>
                {slide.word}
                <span style={{ display: "block", fontSize: "0.22em", color: "#4B5563", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "0.8rem", fontFamily: "var(--font-dm-sans, sans-serif)" }}>
                  {slide.sub}
                </span>
              </h2>
              <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.6, maxWidth: 360, marginTop: "1.5rem", fontFamily: "var(--font-dm-sans, sans-serif)" }}>
                {slide.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Right phone */}
        <div className="sticky-right" style={{ flex: "0 0 50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", height: "100%" }}>
          <div style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,100,20,0.1) 0%, rgba(182,255,0,0.04) 50%, transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* iPhone 17 orange - StickyScroll */}
          <div style={{ filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(255,95,20,0.2))", position: "relative" }}>
            <div className="sticky-phone-outer" style={{
              width: 260, height: 540,
              background: "linear-gradient(160deg, #FF8040 0%, #E85A10 30%, #C94810 55%, #FF6A20 80%, #FF9050 100%)",
              borderRadius: 48, padding: "2px",
              boxShadow: "inset 0 1px 0 rgba(255,200,150,0.5), inset 0 -1px 0 rgba(100,30,0,0.4)",
              position: "relative",
            }}>
              {/* Side buttons */}
              <div style={{ position: "absolute", left: -3, top: 108, width: 3, height: 32, background: "linear-gradient(to right, #C94810, #E86020)", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", left: -3, top: 152, width: 3, height: 32, background: "linear-gradient(to right, #C94810, #E86020)", borderRadius: "2px 0 0 2px" }} />
              <div style={{ position: "absolute", right: -3, top: 136, width: 3, height: 54, background: "linear-gradient(to left, #C94810, #E86020)", borderRadius: "0 2px 2px 0" }} />

              <div className="sticky-phone-inner" style={{
                width: "100%", height: "100%",
                background: "#0d0d0d", borderRadius: 46, overflow: "hidden", position: "relative",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                // ✅ Add these two Safari fixes:
                WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                transform: "translateZ(0)",
              }}>
                {/* Dynamic Island */}
                {/* <div className="sticky-di" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 96, height: 28, background: "#000", borderRadius: 18, zIndex: 20, boxShadow: "0 0 0 1px rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1a2a1a" }} />
                </div> */}

                {SCROLL_SLIDES.map((slide, i) => (
                  <motion.div key={slide.img + i} style={{ position: "absolute", inset: 0, opacity: opacities[i] }}>
                    <Image src={slide.img} alt={`Fittrybe app screen — ${slide.sub}`} fill sizes="260px" style={{ objectFit: "cover", objectPosition: "top" }} />
                  </motion.div>
                ))}

                {/* Screen glare */}
                <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)", borderRadius: 46 }} />
                <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 80, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 4, zIndex: 15 }} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div role="tablist" aria-label="Slide indicator" style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 20 }}>
          {SCROLL_SLIDES.map((slide, i) => (
            <div key={i} role="tab" aria-selected={i === activeSlide} aria-label={`Slide ${i + 1}: ${slide.word}`} style={{ width: i === activeSlide ? 24 : 6, height: 6, borderRadius: 3, background: i === activeSlide ? "#B6FF00" : "rgba(255,255,255,0.15)", transition: "width 0.4s ease, background 0.4s ease" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. BENTO GRID ────────────────────────────────────────────────────────────
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !triggered.current) {
        triggered.current = true;
        let start = 0;
        const inc = Math.max(1, Math.floor(target / 60));
        const timer = setInterval(() => {
  start = Math.min(start + inc, target);
  setDisplay(start);
  if (start >= target) clearInterval(timer);
}, 28) as unknown as number;
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

const SPORT_EMOJIS = [
  { emoji: "⚽", label: "Football", delay: 0 },
  { emoji: "🏀", label: "Basketball", delay: 0.3 },
  { emoji: "🎾", label: "Tennis", delay: 0.6 },
  { emoji: "🏊", label: "Swimming", delay: 0.9 },
  { emoji: "🚴", label: "Cycling", delay: 1.2 },
  { emoji: "🏋️", label: "Gym", delay: 0.2 },
  { emoji: "🏸", label: "Badminton", delay: 0.5 },
  { emoji: "🏃", label: "Running", delay: 0.8 },
  { emoji: "🥊", label: "Boxing", delay: 1.1 },
];

function BentoGrid() {
  const [waitlistCount, setWaitlistCount] = useState(0);
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
        setWaitlistCount(count || 0);
      } catch (error) {
        console.error("Error fetching waitlist count:", error);
      }
    };
    fetchCount();
    const channel = supabase.channel("waitlist-changes").on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, () => fetchCount()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section aria-label="Fittrybe features and stats" style={{ padding: "100px 5vw", background: "#050505" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "3rem", textAlign: "center" }}
      >
        <h2 style={{
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
          fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "-0.02em",
        }}>
          BUILT FOR <span style={{ color: "#B6FF00" }}>PLAYERS</span>
        </h2>
      </motion.div>

      <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "auto auto", gap: 14, maxWidth: 1200, margin: "0 auto" }}>
        {/* Stats card */}
        <motion.article
          className="bento-card" aria-label="Waitlist and launch stats"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0 }}
          style={{ gridColumn: "1 / 2", gridRow: "1 / 3", padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 400, background: "linear-gradient(145deg, #0D0D0D 0%, #111 100%)" }}
        >
          <div>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem" }}>● LIVE COUNT</p>
            <p style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontSize: "clamp(3.5rem, 6vw, 5.5rem)", fontWeight: 900, lineHeight: 1, color: "#fff" }}>
              <AnimatedCount target={waitlistCount + 100 || 240} suffix="+" />
            </p>
            <p style={{ fontSize: "0.85rem", color: "#4B5563", fontWeight: 500, marginTop: "0.5rem" }}>Players on the waitlist</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[{ num: "5+", label: "Sports & growing" }, { num: "FREE", label: "To join & play" }, { num: "2026", label: "Launch target" }].map(({ num, label }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontSize: "1.4rem", fontWeight: 800, color: "#B6FF00" }}>{num}</span>
                <span style={{ fontSize: "0.75rem", color: "#4B5563", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.article>

        {/* Sports icons - Updated with centered heading */}
        <motion.article
          className="bento-card" aria-label="Sports supported by Fittrybe"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ gridColumn: "2 / 4", padding: "2.5rem", background: "#0D0D0D", minHeight: 200 }}
        >
          <h3 style={{ 
            fontSize: "0.68rem", 
            fontWeight: 700, 
            letterSpacing: "0.12em", 
            textTransform: "uppercase", 
            color: "#B6FF00", 
            marginBottom: "1.5rem",
            textAlign: "center" // Added center alignment
          }}>● SPORTS</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }} role="list" aria-label="Supported sports"> {/* Added justifyContent center */}
            {SPORT_EMOJIS.map(({ emoji, label, delay }) => (
              <motion.div key={label} className="sport-icon-float" role="listitem"
                animate={{ y: [0, -8, 0] }} transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay }}
                style={{ width: 60, height: 60 }} aria-label={label} title={label}>
                <span style={{ fontSize: "1.6rem" }} role="img" aria-label={label}>{emoji}</span>
              </motion.div>
            ))}
          </div>
        </motion.article>

        {/* Download CTA - Updated with side-by-side buttons on mobile and centered text */}
        <motion.article
          className="bento-card" aria-label="Download Fittrybe on the App Store and Google Play"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ gridColumn: "2 / 4", padding: "2.5rem", background: "linear-gradient(135deg, #0f1a00 0%, #0D0D0D 60%)" }}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            width: "100%"
          }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ 
                fontSize: "0.68rem", 
                fontWeight: 700, 
                letterSpacing: "0.12em", 
                textTransform: "uppercase", 
                color: "#B6FF00", 
                marginBottom: "0.75rem" 
              }}>● COMING SOON</p>
              <h3 style={{ 
                fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", 
                fontSize: "clamp(1.8rem, 4vw, 3rem)", 
                fontWeight: 900, 
                textTransform: "uppercase", 
                letterSpacing: "-0.02em", 
                lineHeight: 1 
              }}>GET THE APP</h3>
            </div>
            
            <div style={{ 
              display: "flex", 
              gap: "0.75rem", 
              flexWrap: "wrap", 
              justifyContent: "center",
              width: "100%"
            }}>
              <a href="/waitlist" className="store-btn" aria-label="Join waitlist for Fittrybe on the App Store" style={{
                display: "inline-flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "14px 22px",
                borderRadius: "12px", 
                border: "1.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)", 
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
                textDecoration: "none", 
                color: "#fff",
                flex: "0 1 auto", // Allow buttons to shrink but not grow
                minWidth: "160px", // Set minimum width for consistency
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = ""; }}
              >
                <IconApple size={20} color="#fff" />
                <div style={{ textAlign: "center" }}> {/* Center align text inside button */}
                  <div style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.05em" }}>DOWNLOAD ON THE</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>App Store</div>
                </div>
              </a>
              <a href="/waitlist" className="store-btn" aria-label="Join waitlist for Fittrybe on Google Play" style={{
                display: "inline-flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "14px 22px",
                borderRadius: "12px", 
                border: "1.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)", 
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
                textDecoration: "none", 
                color: "#fff",
                flex: "0 1 auto", // Allow buttons to shrink but not grow
                minWidth: "160px", // Set minimum width for consistency
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = ""; }}
              >
                <IconGooglePlay size={20} color="#B6FF00" />
                <div style={{ textAlign: "center" }}> {/* Center align text inside button */}
                  <div style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.05em" }}>GET IT ON</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

// ─── 5. BLOG PREVIEW ─────────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: { seconds: number } | string | null;
  category?: string;
}

function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("blogs").select("*").order("publishedAt", { ascending: false }).limit(3);
        if (data) setPosts(data as BlogPost[]);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Don't render section at all if no posts and not loading
  if (!loading && posts.length === 0) return null;

  const formatDate = (raw: BlogPost["publishedAt"]) => {
    if (!raw) return "";
    const d = typeof raw === "string" ? new Date(raw) : new Date((raw as { seconds: number }).seconds * 1000);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <section aria-label="Latest from the Fittrybe blog" style={{ padding: "100px 5vw", background: "#080808", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
        style={{ marginBottom: "3rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "0.6rem" }}>● FROM THE BLOG</p>
          <h2 style={{
            fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
            fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "-0.02em",
          }}>
            LATEST <span style={{ color: "#B6FF00" }}>READS</span>
          </h2>
        </div>
        <Link href="/blog" style={{
          color: "#9CA3AF", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
          fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.07em", textTransform: "uppercase",
          transition: "color 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#B6FF00"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#9CA3AF"; }}
        >
          View All Posts <IconArrowRight size={14} />
        </Link>
      </motion.div>

      {loading ? (
        // Skeleton loader matching card dimensions
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ borderRadius: 20, background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", height: 340 }}>
              <div style={{ height: 180, background: "linear-gradient(90deg, #111 25%, #181818 50%, #111 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              <div style={{ padding: "1.25rem" }}>
                <div style={{ height: 12, width: "40%", background: "#181818", borderRadius: 6, marginBottom: 12 }} />
                <div style={{ height: 20, width: "90%", background: "#181818", borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, width: "70%", background: "#181818", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              className="bento-card"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55, delay: i * 0.1 }}
              onClick={() => router.push(`/blog/${post.slug}`)}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", overflow: "hidden" }}
              aria-label={`Read blog post: ${post.title}`}
            >
              {/* Cover image / fallback */}
              <div style={{ height: 190, background: post.coverImage ? "transparent" : "linear-gradient(135deg, #0f1a00 0%, #0d0d0d 100%)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {post.coverImage ? (
                  <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "3rem", opacity: 0.15 }}>📝</span>
                  </div>
                )}
                {/* Category badge */}
                {post.category && (
                  <span style={{
                    position: "absolute", top: 14, left: 14,
                    background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.25)",
                    color: "#B6FF00", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "4px 10px", borderRadius: 100,
                  }}>{post.category}</span>
                )}
              </div>

              <div style={{ padding: "1.25rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                {post.publishedAt && (
                  <p style={{ fontSize: "0.68rem", color: "#4B5563", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    {formatDate(post.publishedAt)}
                  </p>
                )}
                <h3 style={{
                  fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
                  fontSize: "1.2rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "-0.01em", lineHeight: 1.2, color: "#fff",
                  marginBottom: "0.6rem", flex: 1,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{post.title}</h3>
                {post.excerpt && (
                  <p style={{
                    fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    marginBottom: "1rem",
                  }}>{post.excerpt}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B6FF00", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "auto" }}>
                  Read More <IconArrowRight size={12} color="#B6FF00" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}


function Footer() {
  // Use lazy initializer to get current year without causing hydration issues
  const [currentYear] = useState<number>(() => new Date().getFullYear());

  return (
    <footer style={{ background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 5vw" }}>
      <div className="footer-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <Link href="/" aria-label="Fittrybe homepage" style={{
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
          fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.02em", textDecoration: "none",
        }}>
          <span style={{ color: "#fff" }}>fit</span>
          <span style={{ color: "#B6FF00" }}>trybe</span>
        </Link>

        <nav aria-label="Footer navigation" style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {[
            // { label: "Privacy Policy", href: "/privacy" },
            // { label: "Terms of Service", href: "/terms" },
            // { label: "Contact Us", href: "mailto:hello@fittrybe.com" },
            { label: "Join Waitlist", href: "/waitlist" },
            { label: "Blog", href: "/blog" },
          ].map(link => (
            <a key={link.label} href={link.href} className="footer-link">{link.label}</a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "0.5rem" }} aria-label="Fittrybe social media links">
          {[
            { href: "https://instagram.com/fittrybe.uk", Icon: IconInstagram, label: "Follow Fittrybe on Instagram" },
            { href: "https://www.facebook.com/share/1AZ19Yqe2y/", Icon: IconFacebook, label: "Follow Fittrybe on Facebook" },
            { href: "https://twitter.com/fittrybe", Icon: IconTwitterX, label: "Follow Fittrybe on X (Twitter)" },
            // { href: "https://tiktok.com/@fittrybe", Icon: IconTiktok, label: "Follow Fittrybe on TikTok" },
          ].map(({ href, Icon, label }) => (
            <a key={href} href={href} className="social-icon-btn" aria-label={label} rel="noopener noreferrer" target="_blank">
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center", fontSize: "0.72rem", color: "#2a2a2a", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        © {currentYear} Fittrybe Ltd. All rights reserved. · London, United Kingdom
      </div>
    </footer>
  );
}

const faqs = [];
// ─── Root Client Component ────────────────────────────────────────────────────
export default function LandingPageClient({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StickyScrollStory />
        <BentoGrid />
        <BlogPreviewSection />
        {/* <FAQSection faqs={faqs} /> */}
      </main>
      <Footer />
    </>
  );
}