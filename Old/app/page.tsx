"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  animate,
  useMotionValueEvent,
} from "framer-motion";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconArrowRight({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconApple({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function IconGooglePlay({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
    </svg>
  );
}

function IconTwitterX({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.988l4.26 5.633 5.746-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconInstagram({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color}/>
    </svg>
  );
}

function IconTiktok({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.53V6.77a4.85 4.85 0 01-1-.08z"/>
    </svg>
  );
}

// ─── CSS Injection ─────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #050505; color: #fff; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-18px) rotate(5deg); }
    66% { transform: translateY(8px) rotate(-3deg); }
  }
  @keyframes floatY2 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-24px) rotate(-8deg); }
  }
  @keyframes floatY3 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    40% { transform: translateY(14px) rotate(6deg); }
    80% { transform: translateY(-10px) rotate(-4deg); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .bento-card {
    border-radius: 20px;
    background: #0D0D0D;
    border: 1px solid rgba(255,255,255,0.07);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease, box-shadow 0.3s ease;
    cursor: default;
  }
  .bento-card:hover {
    transform: scale(1.025) translateY(-4px);
    border-color: rgba(182,255,0,0.3);
    box-shadow: 0 0 40px rgba(182,255,0,0.08), 0 20px 60px rgba(0,0,0,0.5);
  }

  .sport-icon-float {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    font-size: 2rem;
    transition: transform 0.3s ease, border-color 0.3s ease;
  }
  .sport-icon-float:hover {
    border-color: rgba(182,255,0,0.4);
    transform: scale(1.15) rotate(-3deg);
  }

  .social-icon-btn {
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    color: #6B7280;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
    text-decoration: none;
  }
  .social-icon-btn:hover {
    color: #B6FF00;
    border-color: rgba(182,255,0,0.3);
    background: rgba(182,255,0,0.05);
  }

  .footer-link {
    color: #4B5563;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    transition: color 0.2s;
  }
  .footer-link:hover { color: #9CA3AF; }

  .store-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 22px;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    text-decoration: none;
    color: #fff;
  }
  .store-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .bento-grid { grid-template-columns: 1fr !important; }
    .sticky-story-text { font-size: clamp(3rem, 16vw, 5rem) !important; }
    .footer-inner { flex-direction: column !important; align-items: flex-start !important; gap: 1.5rem !important; }
  }

  @media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr !important;
    padding: 120px 6vw 80px !important;
    text-align: center;
    justify-items: center;
  }
  .hero-copy {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }
  .hero-buttons { justify-content: center !important; }
  .hero-phones { display: none !important; }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 110px 5vw 90px !important;
    min-height: 100svh !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
  }
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
      <a href="#" style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: "1.7rem", letterSpacing: "-0.02em",
        textDecoration: "none",
      }}>
        <span style={{ color: "#fff" }}>fit</span>
        <span style={{ color: "#B6FF00" }}>trybe</span>
      </a>

      <a href="/waitlist" style={{
        background: "#B6FF00", color: "#0D0D0D",
        padding: "0.45rem 1.3rem", borderRadius: 6,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.07em",
        textTransform: "uppercase", textDecoration: "none",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(182,255,0,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
      >Join Waitlist</a>
    </motion.nav>
  );
}

// ─── 1. IMMERSIVE HERO ────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      alignItems: "center", padding: "140px 5vw 100px", gap: "4rem",
      position: "relative", overflow: "hidden",
    }} className="hero-section">

      {/* Background Video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <video autoPlay muted loop playsInline style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          opacity: 0.18,
          filter: "saturate(0.4) brightness(0.7)",
        }}>
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: "absolute", inset: 0,
          background: `
            linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0.65) 75%, rgba(5,5,5,0.95) 100%),
            linear-gradient(to right, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.0) 60%)
          `,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }} />
      </div>

      {/* Lime glow */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        background: "radial-gradient(circle, rgba(182,255,0,0.05) 0%, transparent 70%)",
        top: "50%", left: "30%", transform: "translate(-50%, -50%)", pointerEvents: "none",
        animation: "glowPulse 4s ease-in-out infinite", zIndex: 1,
      }} />

      {/* Left copy */}
      <div className="hero-copy" style={{ position: "relative", zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.2)",
            borderRadius: 100, padding: "6px 16px", marginBottom: "1.5rem",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#B6FF00",
          }}
        >
          <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "blink 1.5s infinite" }} />
          Coming Soon — Be First To Play
        </motion.div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
          fontSize: "clamp(3.5rem, 7vw, 6.5rem)", lineHeight: 0.92,
          letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: "1.5rem",
        }}>
          {["Find", "Your", "Game."].map((word, i) => (
            <div key={word} style={{ overflow: "hidden", lineHeight: 0.95 }}>
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.35 + i * 0.14, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "block",
                  color: i === 1 ? "#B6FF00" : "#fff",
                }}
              >{word}</motion.div>
            </div>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          style={{
            fontSize: "1.05rem", color: "#6B7280", lineHeight: 1.7, maxWidth: 420,
            marginBottom: "2.5rem",
          }}
        >
          Discover real sports sessions near you. Join a game, meet people worth playing with, and build a routine that sticks.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="hero-buttons"
          style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
        >
          <a href="/waitlist" style={{
            background: "#B6FF00", color: "#0D0D0D", padding: "0.85rem 2rem",
            borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1rem", fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(182,255,0,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >Join Waitlist <IconArrowRight size={16} color="#0D0D0D" /></a>

          <a href="#how" style={{
            color: "#9CA3AF", padding: "0.85rem 2rem",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif",
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

      {/* Right — Video Phone Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="hero-phones"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 2, minHeight: 600,
        }}
      >
        {/* Glow blob */}
        <div style={{
          position: "absolute", width: 440, height: 440,
          background: "radial-gradient(circle, rgba(182,255,0,0.08) 0%, transparent 65%)",
          filter: "blur(60px)", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none",
        }} />

        {/* Phone with video */}
        <div style={{
          position: "relative", zIndex: 3,
          transform: "rotateY(-9deg) rotateX(4deg)",
        }}>
          <div style={{
            width: 290, height: 600, background: "#0a0a0a", borderRadius: 44,
            border: "1.5px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.4)",
            position: "relative", overflow: "hidden",
          }}>
            <video
              autoPlay muted loop playsInline
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "top",
                borderRadius: 44, display: "block",
              }}
            >
              <source src="/videos/mockup.mp4" type="video/mp4" />
            </video>
            {/* Home indicator */}
            <div style={{
              position: "absolute", bottom: 10, left: "50%",
              transform: "translateX(-50%)", width: 100, height: 4,
              background: "rgba(255,255,255,0.3)", borderRadius: 4, zIndex: 15,
            }} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}


// ─── 2. STICKY SCROLL STORY ───────────────────────────────────────────────────
const SCROLL_SLIDES = [
  { label: "01", word: "EXPLORE", sub: "Find sessions near you", img: "/images/screen1.jpg" },
  { label: "02", word: "CONNECT", sub: "Chat with your crew", img: "/images/screen2.jpg" },
  { label: "03", word: "PLAY", sub: "Show up. Get active.", img: "/images/screen1.jpg" },
];

function StickyScrollStory() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeSlide, setActiveSlide] = useState(0);

  // Each slide occupies 1/3 of the scroll range
  // Fade in over first 10%, hold, fade out over last 10% of its range
  const useMakeOpacity = (start: number, end: number) =>
    useTransform(
      scrollYProgress,
      [start, start + 0.06, end - 0.06, end],
      [0, 1, 1, 0]
    );

  const opacity0 = useMakeOpacity(0, 0.33);
  const opacity1 = useMakeOpacity(0.33, 0.66);
  const opacity2 = useMakeOpacity(0.66, 1.0);
  const opacities = [opacity0, opacity1, opacity2];

  // Drive active dot from scroll position directly
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.33) setActiveSlide(0);
    else if (v < 0.66) setActiveSlide(1);
    else setActiveSlide(2);
  });

  return (
    <section ref={containerRef} style={{ height: "300vh", position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", alignItems: "center",
        overflow: "hidden", background: "#050505",
      }}>
        {/* Text slides — left side */}
        <div style={{ position: "relative", flex: "0 0 50%", paddingLeft: "5vw", height: "100%", display: "flex", alignItems: "center" }}>
          {SCROLL_SLIDES.map((slide, i) => (
            <motion.div
              key={slide.label}
              style={{
                opacity: opacities[i],
                position: "absolute",
                pointerEvents: "none",
              }}
            >
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(4rem, 10vw, 9rem)",
                lineHeight: 0.88,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                color: "#fff",
              }}>
                <span style={{
                  display: "block",
                  fontSize: "0.32em",
                  color: "#B6FF00",
                  marginBottom: "0.5rem",
                  letterSpacing: "0.08em",
                }}>
                  {slide.label}
                </span>
                {slide.word}
                <span style={{
                  display: "block",
                  fontSize: "0.22em",
                  color: "#4B5563",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginTop: "0.8rem",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {slide.sub}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Phone mockup — right side */}
        <div style={{
          flex: "0 0 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          height: "100%",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute",
            width: 400, height: 400,
            background: "radial-gradient(circle, rgba(182,255,0,0.07) 0%, transparent 65%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }} />

          <div style={{
            width: 280, height: 580,
            background: "#0a0a0a",
            borderRadius: 44,
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 60px 120px rgba(0,0,0,0.9), 0 0 80px rgba(182,255,0,0.05)",
            overflow: "hidden",
            position: "relative",
          }}>
            {SCROLL_SLIDES.map((slide, i) => (
              <motion.div
                key={slide.img + i}
                style={{ position: "absolute", inset: 0, opacity: opacities[i] }}
              >
                <Image
                  src={slide.img}
                  alt={slide.word}
                  fill
                  style={{ objectFit: "cover", objectPosition: "top" }}
                />
              </motion.div>
            ))}
            <div style={{
              position: "absolute", bottom: 10, left: "50%",
              transform: "translateX(-50%)", width: 90, height: 4,
              background: "rgba(255,255,255,0.25)", borderRadius: 4, zIndex: 15,
            }} />
          </div>
        </div>

        {/* Progress dots */}
        <div style={{
          position: "absolute", bottom: 40, left: "50%",
          transform: "translateX(-50%)",
          display: "flex", gap: 10, zIndex: 20,
        }}>
          {SCROLL_SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === activeSlide ? 24 : 6,
              height: 6, borderRadius: 3,
              background: i === activeSlide ? "#B6FF00" : "rgba(255,255,255,0.15)",
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── 3. BENTO BOX GRID ────────────────────────────────────────────────────────
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
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
        }, 28);
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
    const unsubscribe = onSnapshot(collection(db, "waitlist"), snap => {
      setWaitlistCount(snap.size);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section style={{ padding: "100px 5vw", background: "#050505" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "3rem", textAlign: "center" }}
      >
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          fontWeight: 900, textTransform: "uppercase",
          letterSpacing: "-0.02em",
        }}>
          BUILT FOR <span style={{ color: "#B6FF00" }}>PLAYERS</span>
        </span>
      </motion.div>

      <div
        className="bento-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "auto auto",
          gap: 14,
          maxWidth: 1200, margin: "0 auto",
        }}
      >
        {/* Box 1: Stats */}
        <motion.div
          className="bento-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0 }}
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 3",
            padding: "2.5rem",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            minHeight: 400,
            background: "linear-gradient(145deg, #0D0D0D 0%, #111 100%)",
          }}
        >
          <div>
            <div style={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem",
            }}>
              ● LIVE COUNT
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(3.5rem, 6vw, 5.5rem)",
              fontWeight: 900, lineHeight: 1, color: "#fff",
            }}>
              <AnimatedCount target={waitlistCount ?? 240} suffix="+" />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#4B5563", fontWeight: 500, marginTop: "0.5rem" }}>
              Players on the waitlist
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { num: "5+", label: "Sports & growing" },
              { num: "FREE", label: "To join & play" },
              { num: "Jan '26", label: "Launch target" },
            ].map(({ num, label }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.4rem", fontWeight: 800, color: "#B6FF00" }}>{num}</span>
                <span style={{ fontSize: "0.75rem", color: "#4B5563", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Box 2: Sports Icons */}
        <motion.div
          className="bento-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            gridColumn: "2 / 4",
            padding: "2.5rem",
            background: "#0D0D0D",
            minHeight: 200,
          }}
        >
          <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1.5rem" }}>
            ● SPORTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {SPORT_EMOJIS.map(({ emoji, label, delay }) => (
              <motion.div
                key={label}
                className="sport-icon-float"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay }}
                style={{ width: 60, height: 60 }}
                title={label}
              >
                <span style={{ fontSize: "1.6rem" }}>{emoji}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Box 3: Download */}
        <motion.div
          className="bento-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            gridColumn: "2 / 4",
            padding: "2.5rem",
            background: "linear-gradient(135deg, #0f1a00 0%, #0D0D0D 60%)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "0.75rem" }}>
              ● COMING SOON
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              GET THE APP
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/waitlist" className="store-btn">
              <IconApple size={20} color="#fff" />
              <div>
                <div style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.05em" }}>DOWNLOAD ON THE</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.02em" }}>App Store</div>
              </div>
            </a>
            <a href="/waitlist" className="store-btn">
              <IconGooglePlay size={20} color="#B6FF00" />
              <div>
                <div style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.05em" }}>GET IT ON</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.02em" }}>Google Play</div>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 4. FOOTER ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: "#0D0D0D",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      padding: "40px 5vw",
    }}>
      <div
        className="footer-inner"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "1rem",
        }}
      >
        <a href="#" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.02em",
          textDecoration: "none",
        }}>
          <span style={{ color: "#fff" }}>fit</span>
          <span style={{ color: "#B6FF00" }}>trybe</span>
        </a>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {["Privacy", "Terms", "Contact"].map(link => (
            <a key={link} href="#" className="footer-link">{link}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { href: "#", Icon: IconTwitterX },
            { href: "#", Icon: IconInstagram },
            { href: "#", Icon: IconTiktok },
          ].map(({ href, Icon }, i) => (
            <a key={i} href={href} className="social-icon-btn">
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: "1.5rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        textAlign: "center",
        fontSize: "0.72rem", color: "#2a2a2a",
        fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        © {new Date().getFullYear()} Fittrybe. All rights reserved.
      </div>
    </footer>
  );
}

// ─── Root Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <Navbar />
      <main>
        <HeroSection />
        <StickyScrollStory />
        <BentoGrid />
      </main>
      <Footer />
    </>
  );
}