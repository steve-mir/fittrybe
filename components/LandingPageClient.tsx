/**
 * ─── Fittrybe — Landing Page Client Component ────────────────────────────────
 *
 * Performance-tuned shell:
 *  • Navbar + Hero are CSS-animated (no framer-motion in the initial bundle)
 *  • Below-the-fold sections (Sticky scroll, Bento, Blog, FAQ) are dynamic
 *    chunks — framer-motion + supabase ship only when the user reaches them
 *  • The H1 flip word is a CSS-only animation (no setInterval)
 *  • CTA hovers are CSS classes (no inline onMouseEnter/Leave)
 *  • Hero phone video defers play to next idle tick + auto-pauses off-screen
 *  • Hero background video sources attach after window 'load' so they don't
 *    compete with critical content for network/CPU
 */
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import Link from "next/link";

// ─── Below-the-fold sections are code-split ──────────────────────────────────
// Each chunk loads in parallel after the hero is parsed. Supabase, framer
// motion, and FAQ logic stay out of the initial bundle.
// ssr is left enabled (default) so markup stays in the HTML for SEO.
const StickyScrollStory = dynamic(() => import("@/components/landing/StickyScrollStory"));
const BentoGrid = dynamic(() => import("@/components/landing/BentoGrid"));
const BlogPreviewSection = dynamic(() => import("@/components/landing/BlogPreviewSection"));
const FAQSection = dynamic(() => import("@/components/landing/FAQSection"));

// ─── Icons (only those used by Navbar + Hero + Footer remain in the shell) ──
function IconArrowRight({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
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
function IconFacebook({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M9.5 3v3.5H7V10h2.5v9h4v-9h3.5V6.5H13.5V4c0-.6.4-1 1-1h3V0h-4C10.8 0 9.5 1.3 9.5 3z"/>
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
// Plain <nav> with a rAF-throttled scroll listener that just toggles a class.
// CSS handles the animation + scrolled-state styling.
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 60);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`site-nav anim-nav${scrolled ? " scrolled" : ""}`}
    >
      <Link
        href="/"
        aria-label="Fittrybe — return to homepage"
        style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}
      >
        <Image src="/logo-mark.png" alt="" width={32} height={32} priority style={{ display: "block" }} />
        <Wordmark height={26} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link href="/sports" aria-label="Browse sports on Fittrybe" className="nav-link">Sports</Link>
        <Link href="/events" aria-label="View upcoming sports sessions" className="nav-link">Sessions</Link>
        <Link href="/blog" aria-label="Read the Fittrybe blog" className="nav-link">Blog</Link>
        <a href="/waitlist" aria-label="Join the Fittrybe waitlist for early access" className="nav-cta">Join Waitlist</a>
      </div>
    </nav>
  );
}

// ─── Hero phone video ─────────────────────────────────────────────────────────
// preload="none" — we attach <source> only after the parent IntersectionObserver
// fires, then call play() ourselves. Saves bytes + CPU when off-screen.
function HeroPhoneVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let attached = false;

    const tryPlay = () => {
      v.muted = true;
      v.playsInline = true;
      const p = v.play();
      if (p !== undefined) p.catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          if (!attached) {
            attached = true;
            // Attach <source> on demand
            const src = document.createElement("source");
            src.src = "/videos/mockup.mp4";
            src.type = "video/mp4";
            v.appendChild(src);
            v.load();
          }
          tryPlay();
        } else {
          v.pause();
        }
      },
      { rootMargin: "100px", threshold: 0.01 }
    );
    observer.observe(v);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      aria-label="Fittrybe app preview showing local sports sessions"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
    >
      <track kind="captions" />
    </video>
  );
}

// ─── Hero background video ────────────────────────────────────────────────────
// Hidden on mobile (display:none from .hero-bg-video media query). On desktop,
// we delay <source> attachment until after window 'load' so the 3.4 MB asset
// doesn't compete with critical content for network bandwidth.
function HeroBgVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Don't bother on mobile — CSS hides the parent.
    if (window.matchMedia("(max-width: 768px)").matches) return;

    let cancelled = false;
    const attach = () => {
      if (cancelled || v.querySelector("source")) return;
      const src = document.createElement("source");
      src.src = "/videos/hero.mp4";
      src.type = "video/mp4";
      v.appendChild(src);
      v.load();
      v.play().catch(() => {});
    };

    if (document.readyState === "complete") {
      // Defer to next idle tick so we never block FCP/LCP work.
      const idle = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (idle) idle(attach, { timeout: 2000 });
      else setTimeout(attach, 1000);
    } else {
      window.addEventListener("load", () => setTimeout(attach, 800), { once: true });
    }

    // Pause when scrolled fully out of view (saves decoder CPU).
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) v.pause();
        else if (v.querySelector("source")) v.play().catch(() => {});
      },
      { threshold: 0 }
    );
    io.observe(v);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      aria-label="Sports action background video"
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "center",
        opacity: 0.18, filter: "saturate(0.4) brightness(0.7)",
      }}
    >
      <track kind="captions" />
    </video>
  );
}

// ─── 1. HERO ──────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Hero — Find your local sports game"
      className="hero-section"
      style={{
        minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center", padding: "140px 5vw 100px", gap: "4rem",
        position: "relative", overflow: "hidden",
      }}
    >
      <div className="hero-bg-video" style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <HeroBgVideo />
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
        <div
          className="anim-fade-up-1"
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
        </div>

        <h1 style={{
          fontFamily: "var(--font-anton, 'Anton', sans-serif)", fontWeight: 900,
          fontSize: "clamp(3.5rem, 7vw, 6.5rem)", lineHeight: 0.92,
          letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: "1.5rem",
        }}>
          <span className="word-mask"><span className="word-rise word-rise-1" style={{ color: "#fff" }}>Find</span></span>
          <span className="word-mask"><span className="word-rise word-rise-2" style={{ color: "#B6FF00" }}>Your</span></span>
          <span className="word-mask">
            <span className="word-rise word-rise-3" style={{ color: "#fff" }}>
              <span className="flip-word" aria-label="game or trybe">
                <span>game.</span>
                <span>trybe.</span>
              </span>
            </span>
          </span>
        </h1>

        <p
          className="anim-fade-up-2"
          style={{ fontSize: "1.05rem", color: "#6B7280", lineHeight: 1.7, maxWidth: 420, marginBottom: "2.5rem" }}
        >
          Discover real sports sessions near you. Join a game, meet people worth playing with, and build a routine that sticks. Football, basketball, tennis, badminton — all in one app.
        </p>

        <div
          className="hero-buttons anim-fade-up-3"
          style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
        >
          <a
            href="/waitlist"
            aria-label="Join the Fittrybe waitlist and get early access to local sports sessions"
            className="cta-primary"
          >
            Get Early Access <IconArrowRight size={16} color="#0D0D0D" />
          </a>
          <a
            href="#how-it-works"
            aria-label="Learn how Fittrybe works"
            className="cta-secondary"
          >
            ▶ How It Works
          </a>
        </div>
      </div>

      {/* Right — iPhone 17 Orange Phone Mockup */}
      <div
        className="hero-phones anim-phone"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2, minHeight: 600 }}
      >
        <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, rgba(255,95,31,0.18) 0%, rgba(182,255,0,0.06) 50%, transparent 70%)", filter: "blur(60px)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 3, transform: "rotateY(-9deg) rotateX(4deg)", transformStyle: "preserve-3d" }}>
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
            <div style={{ position: "absolute", left: -3, top: 110, width: 3, height: 36, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", left: -3, top: 158, width: 3, height: 36, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", left: -3, top: 72, width: 3, height: 26, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 3px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", right: -3, top: 130, width: 3, height: 50, background: "linear-gradient(to bottom, #FF7A2A, #C93B08)", borderRadius: "0 2px 2px 0", boxShadow: "1px 0 3px rgba(0,0,0,0.4)" }} />

            <div style={{
              width: "100%", height: "100%",
              borderRadius: 50,
              background: "#080808",
              overflow: "hidden",
              position: "relative",
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              transform: "translateZ(0)",
            }}>
              <HeroPhoneVideo />

              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)", pointerEvents: "none", zIndex: 10, borderRadius: 50 }} />
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 100, height: 4, background: "rgba(255,255,255,0.35)", borderRadius: 4, zIndex: 15 }} aria-hidden="true" />
            </div>
          </div>

          <div style={{
            position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 60,
            background: "radial-gradient(ellipse, rgba(255,95,31,0.25) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }} />
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const [currentYear] = useState<number>(() => new Date().getFullYear());

  return (
    <footer style={{ background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 5vw" }}>
      <div className="footer-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <Link href="/" aria-label="Fittrybe homepage" style={{
          display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none",
        }}>
          <Image src="/logo-mark.png" alt="" width={28} height={28} style={{ display: "block" }} />
          <Wordmark height={22} />
        </Link>

        <nav aria-label="Footer navigation" style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: "Sports", href: "/sports" },
            { label: "Sessions", href: "/events" },
            { label: "Blog", href: "/blog" },
            { label: "Join Waitlist", href: "/waitlist" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Use", href: "/terms" },
          ].map(link => (
            <a key={link.label} href={link.href} className="footer-link">{link.label}</a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "0.5rem" }} aria-label="Fittrybe social media links">
          {[
            { href: "https://instagram.com/fittrybe.uk", Icon: IconInstagram, label: "Follow Fittrybe on Instagram" },
            { href: "https://www.facebook.com/share/1AZ19Yqe2y/", Icon: IconFacebook, label: "Follow Fittrybe on Facebook" },
            { href: "https://twitter.com/fittrybe", Icon: IconTwitterX, label: "Follow Fittrybe on X (Twitter)" },
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

// ─── Root Client Component ────────────────────────────────────────────────────
export default function LandingPageClient({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  // landing-root wrapper restores the original #050505 page background.
  // Without it, sections that don't set their own background (Hero, FAQ)
  // would show through to the body default (var(--background) = #0a0a0a).
  return (
    <div className="landing-root">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StickyScrollStory />
        <BentoGrid />
        <BlogPreviewSection />
        <FAQSection faqs={faqs} />
      </main>
      <Footer />
    </div>
  );
}
