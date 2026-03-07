"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SlideItem {
  key: string;
  caption: string;
  img: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SEQUENCE: SlideItem[] = [
  { key: "explore",  caption: "Discover sessions near you",    img: "/images/screen1.jpg" },
  { key: "session",  caption: "Tap to see full details",        img: "/images/screen2.jpg" },
  { key: "explore2", caption: "Find games by sport & distance", img: "/images/screen1.jpg" },
  { key: "session2", caption: "Your tribe is ready to play",    img: "/images/screen2.jpg" },
];
const SLIDE_DURATION = 2500;
const TRANSITION_MS  = 400;

// ─── Sub-components ──────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 5vw", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: scrolled || menuOpen ? "rgba(13,13,13,0.95)" : "transparent",
          backdropFilter: scrolled || menuOpen ? "blur(16px)" : "none",
          borderBottom: scrolled || menuOpen ? "1px solid rgba(182,255,0,0.15)" : "none",
          transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease",
        }}
      >
        <a href="#" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.02em", textDecoration: "none", zIndex: 101 }}>
          <span style={{ color: "#fff" }}>fit</span>
          <span style={{ color: "#B6FF00" }}>trybe</span>
        </a>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {["About", "Features", "How It Works", "Community"].map((label, i) => {
            const hrefs = ["#about-us", "#features", "#how", "#community"];
            return (
              <a key={label} href={hrefs[i]} style={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.03em", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
              >{label}</a>
            );
          })}
          <a href="#waitlist" style={{
            background: "#B6FF00", color: "#0D0D0D", padding: "0.5rem 1.4rem",
            borderRadius: 4, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.05em",
            textTransform: "uppercase", textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(182,255,0,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >Join Waitlist</a>
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          style={{
            display: "none", flexDirection: "column", gap: 5, background: "none",
            border: "none", cursor: "pointer", padding: 8, zIndex: 101,
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2,
              transition: "transform 0.3s, opacity 0.3s",
              transform: menuOpen
                ? i === 0 ? "translateY(7px) rotate(45deg)" : i === 2 ? "translateY(-7px) rotate(-45deg)" : "scaleX(0)"
                : "none",
              opacity: menuOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className="mobile-menu" style={{
        position: "fixed", top: 68, left: 0, right: 0, zIndex: 99,
        background: "rgba(13,13,13,0.97)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(182,255,0,0.15)",
        padding: menuOpen ? "1.5rem 5vw 2rem" : "0 5vw",
        maxHeight: menuOpen ? 400 : 0, overflow: "hidden",
        transition: "max-height 0.4s ease, padding 0.3s ease",
        display: "flex", flexDirection: "column", gap: "0.25rem",
      }}>
        {["About", "Features", "How It Works", "Community"].map((label, i) => {
          const hrefs = ["#about-us", "#features", "#how", "#community"];
          return (
            <a key={label} href={hrefs[i]} onClick={() => setMenuOpen(false)} style={{
              color: "#9CA3AF", textDecoration: "none", fontSize: "1.1rem", fontWeight: 600,
              padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>{label}</a>
          );
        })}
        <a href="#waitlist" onClick={() => setMenuOpen(false)} style={{
          display: "inline-block", marginTop: "1rem",
          background: "#B6FF00", color: "#0D0D0D", padding: "0.75rem 1.5rem",
          borderRadius: 4, fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.05em",
          textTransform: "uppercase", textDecoration: "none", textAlign: "center",
        }}>Join Waitlist</a>
      </div>
    </>
  );
}

function HeroSection() {
  return (
    <section id="hero" style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
      alignItems: "center", padding: "120px 5vw 80px", gap: "4rem",
      position: "relative", overflow: "hidden",
    }} className="hero-section">
      {/* bg glow */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        background: "radial-gradient(circle, rgba(182,255,0,0.12) 0%, transparent 70%)",
        top: "50%", left: "30%", transform: "translate(-50%, -50%)", pointerEvents: "none",
        animation: "glowPulse 4s ease-in-out infinite",
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.15)",
          borderRadius: 2, padding: "0.35rem 0.8rem", fontSize: "0.75rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "#B6FF00",
          marginBottom: "1.5rem", animation: "fadeUp 0.6s 0.2s forwards", opacity: 0,
        }}>
          <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", display: "inline-block", animation: "blink 1.5s infinite" }} />
          🔥 Coming Soon — Be First To Play
        </div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
          fontSize: "clamp(3.5rem, 7vw, 6.5rem)", lineHeight: 0.92,
          letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: "1.5rem",
        }}>
          {["Find", "Your", "Game."].map((word, i) => (
            <span key={word} style={{ display: "block", overflow: "hidden" }}>
              <span style={{
                display: "block", transform: "translateY(110%)",
                animation: `slideUp 0.7s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.15}s forwards`,
                color: i === 1 ? "#B6FF00" : "#fff",
              }}>{word}</span>
            </span>
          ))}
        </h1>

        <p style={{
          fontSize: "1.05rem", color: "#9CA3AF", lineHeight: 1.7, maxWidth: 420,
          marginBottom: "2.5rem", opacity: 0, transform: "translateY(20px)",
          animation: "fadeUp 0.6s 0.8s forwards",
        }}>
          Discover real sports sessions near you. Join a game, meet your tribe, show up and play. Local sport — made social and consistent.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", opacity: 0, transform: "translateY(20px)", animation: "fadeUp 0.6s 1s forwards" }}>
          <a href="#waitlist" style={{
            background: "#B6FF00", color: "#0D0D0D", padding: "0.85rem 2rem", border: "none",
            borderRadius: 4, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 800,
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(182,255,0,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >Join Waitlist →</a>
          <a href="#how" style={{
            color: "#fff", padding: "0.85rem 2rem", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "border-color 0.2s, color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#B6FF00"; e.currentTarget.style.color = "#B6FF00"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
          >▶ How It Works</a>
        </div>
      </div>

      {/* Phone mockups */}
      <div className="hero-phones" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: 600, opacity: 0, animation: "fadeUp 0.8s 0.5s forwards" }}>
        {[
          { cls: "phone-1", style: { width: 220, height: 475, left: "50%", top: "50%", transform: "translate(-70%, -50%) rotate(-6deg)", zIndex: 2, animation: "floatA 6s ease-in-out infinite" } },
          { cls: "phone-2", style: { width: 220, height: 475, left: "50%", top: "50%", transform: "translate(-30%, -50%) rotate(4deg)", zIndex: 3, animation: "floatB 6s ease-in-out infinite" } },
        ].map(({ cls, style }, i) => (
          <div key={cls} style={{
            position: "absolute", borderRadius: 38, overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            ...style,
          }}>
            <Image
              src={i === 0 ? "/images/screen1.jpg" : "/images/screen2.jpg"}
              alt={i === 0 ? "Explore screen" : "Event detail screen"}
              width={220} height={475}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsBar() {
  const [counts, setCounts] = useState([0, 0]);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const targets = [5, 100];
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !animated.current) {
        animated.current = true;
        targets.forEach((target, idx) => {
          let count = 0;
          const inc = Math.max(1, Math.floor(target / 60));
          const timer = setInterval(() => {
            count = Math.min(count + inc, target);
            setCounts(prev => { const next = [...prev]; next[idx] = count; return next; });
            if (count >= target) clearInterval(timer);
          }, 25);
        });
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="stats-bar" style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      borderTop: "1px solid rgba(182,255,0,0.15)", borderBottom: "1px solid rgba(182,255,0,0.15)",
      padding: "0 5vw",
    }}>
      {[
        { num: `${counts[0]}+`, label: "Sports & Growing" },
        { num: `${counts[1]}+`, label: "Real People. Local Games" },
        { num: "FREE", label: "To Join & Play" },
      ].map(({ num, label }, i) => (
        <div key={label} style={{
          padding: "2rem 0", textAlign: "center",
          borderRight: i < 2 ? "1px solid rgba(182,255,0,0.15)" : "none",
        }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1, color: "#B6FF00", display: "block" }}>{num}</span>
          <span style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)", fontWeight: 500, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.3rem", display: "block" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function PhoneCarousel() {
  const [current, setCurrent] = useState(-1);
  const [slideStates, setSlideStates] = useState<string[]>(SEQUENCE.map(() => "idle"));
  const [caption, setCaption] = useState("");
  const [captionVisible, setCaptionVisible] = useState(false);
  const [fillWidths, setFillWidths] = useState<string[]>(SEQUENCE.map(() => "0%"));
  const [fillingIdx, setFillingIdx] = useState(-1);
  const started = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(-1);

  const showSlide = useCallback((idx: number) => {
    const prevIdx = currentRef.current;
    currentRef.current = idx;
    setCurrent(idx);
    setFillWidths(SEQUENCE.map((_, i) => i < idx ? "100%" : "0%"));
    setFillingIdx(idx);
    setSlideStates(prevStates => SEQUENCE.map((_, i) => {
      if (i === prevIdx && prevIdx >= 0) return "exiting";
      if (i === idx) return "entering";
      return "idle";
    }));
    setTimeout(() => {
      setSlideStates(prev => prev.map((s, i) => {
        if (i === idx) return "active";
        if (s === "exiting") return "idle";
        return s;
      }));
    }, 50);
    setTimeout(() => {
      setSlideStates(prev => prev.map((s, i) => i === idx ? "active" : (s === "exiting" ? "idle" : s)));
    }, TRANSITION_MS);
    setCaptionVisible(false);
    setTimeout(() => {
      setCaption(SEQUENCE[idx].caption);
      setCaptionVisible(true);
    }, 300);
  }, []);

  const startCarousel = useCallback(() => {
    if (started.current) return;
    started.current = true;
    showSlide(0);
    timerRef.current = setInterval(() => {
      showSlide((currentRef.current + 1) % SEQUENCE.length);
    }, SLIDE_DURATION + TRANSITION_MS);
  }, [showSlide]);

  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) startCarousel();
    }, { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { observer.disconnect(); if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCarousel]);

  const [inView, setInView] = useState(false);
  const auLeftRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setInView(true);
    }, { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const slideTransform = (state: string) => {
    if (state === "entering") return "translateY(100%)";
    if (state === "active") return "translateY(0%)";
    if (state === "exiting") return "translateY(-100%)";
    return "translateY(100%)";
  };

  return (
    <section id="about-us" ref={sectionRef} className="phone-carousel-section" style={{
      minHeight: "100vh", padding: "100px 6vw", display: "flex",
      alignItems: "center", position: "relative", overflow: "hidden", background: "#080d08",
    }}>
      <div style={{ position: "absolute", top: "50%", right: "25%", transform: "translate(50%, -50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(182,255,0,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div className="phone-carousel-grid" style={{ display: "grid", gridTemplateColumns: "40% 60%", width: "100%", maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Left */}
        <div ref={auLeftRef} style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 60, gap: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.2)",
            color: "#B6FF00", fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 14px",
            borderRadius: 100, width: "fit-content",
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "pulse-dot 2s ease-in-out infinite" }} />
            About Fittrybe
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 4.5vw, 62px)", fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff",
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s",
          }}>
            Find your game.<br />
            <span style={{ color: "#B6FF00" }}>Play with your city.</span>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.65, color: "#9CA3AF", maxWidth: 420,
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.5s ease 0.16s, transform 0.5s ease 0.16s",
          }}>
            Discover local sports sessions nearby, reserve your spot in one tap, connect with your crew before you arrive, and build a track record worth showing off.
          </p>

          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.5s ease 0.24s, transform 0.5s ease 0.24s",
          }}>
            {[
              { icon: "🔥", title: "Explore Sessions", desc: "Browse nearby games by sport, distance, and time" },
              { icon: "📅", title: "Join or Host", desc: "Reserve your spot or create your own session in minutes" },
              { icon: "💬", title: "Group Chat", desc: "Every event has a live chat — your teammates are waiting" },
              { icon: "👤", title: "Build Your Rep", desc: "Track attendance, reliability score, and hosted events" },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 18px", background: "#141414",
                border: "1px solid #1e1e1e", borderRadius: 14, transition: "border-color 0.3s, transform 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(182,255,0,0.3)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ fontSize: 20, minWidth: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(182,255,0,0.08)", borderRadius: 10, border: "1px solid rgba(182,255,0,0.12)" }}>{icon}</div>
                <div>
                  <strong style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{title}</strong>
                  <span style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#B6FF00", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, fontWeight: 700, letterSpacing: "0.02em", padding: "16px 32px",
            borderRadius: 100, border: "none", cursor: "pointer", width: "fit-content",
            opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.5s ease 0.32s, transform 0.5s ease 0.32s, box-shadow 0.25s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(182,255,0,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = ""; }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Join the Waitlist
          </button>
        </div>

        {/* Right - Phone */}
        <div className="phone-right" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 700 }}>
          <div style={{ position: "absolute", width: 440, height: 440, background: "radial-gradient(circle, rgba(182,255,0,0.18) 0%, transparent 65%)", filter: "blur(60px)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none" }} />
          {[{ side: "left", style: { left: "calc(50% - 280px)", top: "50%", transform: "translateY(-50%) rotate(-8deg) scale(0.85)" } },
            { side: "right", style: { right: "calc(50% - 280px)", top: "50%", transform: "translateY(-50%) rotate(8deg) scale(0.85)" } }].map(({ side, style }) => (
            <div key={side} style={{
              position: "absolute", width: 240, height: 490, borderRadius: 36,
              border: "1px solid rgba(182,255,0,0.1)", background: "rgba(182,255,0,0.02)", zIndex: 1,
              opacity: inView ? 0.5 : 0, filter: "blur(1px)", transition: "opacity 0.8s ease 0.6s", ...style,
            }} />
          ))}
          {["🏸", "⚽", "🏀", "🎾", "🏃"].map((emoji, i) => (
            <div key={emoji} style={{
              position: "absolute", fontSize: 22, opacity: inView ? 0.12 : 0, pointerEvents: "none", zIndex: 2,
              transition: "opacity 0.6s ease",
              ...[{ left: "8%", top: "20%" }, { left: "15%", bottom: "25%" }, { right: "8%", top: "30%" }, { right: "18%", bottom: "20%" }, { left: "50%", top: "10%" }][i],
              animation: `float1 ${[8,9,7,10,8.5][i]}s ease-in-out infinite ${[0,1,2,0.5,1.5][i]}s`,
            }}>{emoji}</div>
          ))}
          <div style={{
            position: "relative", zIndex: 3,
            opacity: inView ? 1 : 0, transform: inView ? "translateY(0) rotateY(-9deg) rotateX(4deg)" : "translateY(40px)",
            transition: inView ? "opacity 0.7s ease 0.3s, transform 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s" : "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
          }}>
            <div style={{
              width: 290, height: 600, background: "#111", borderRadius: 44,
              border: "1.5px solid #2a2a2a",
              boxShadow: "0 0 0 1px rgba(182,255,0,0.15), 0 40px 80px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.4)",
              position: "relative", overflow: "hidden",
            }}>
              {/* notch */}
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 100, height: 24, background: "#0D0D0D", borderRadius: "0 0 18px 18px", zIndex: 10 }} />
              {/* progress */}
              <div style={{ position: "absolute", top: 10, left: 20, right: 20, zIndex: 11, display: "flex", gap: 4 }}>
                {SEQUENCE.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2, background: "#B6FF00",
                      width: fillWidths[i],
                      transition: i === fillingIdx && fillWidths[i] === "0%" ? "none" : i === fillingIdx ? `width ${SLIDE_DURATION}ms linear` : "none",
                    }} />
                  </div>
                ))}
              </div>
              {/* screen */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 44, overflow: "hidden", background: "#0D0D0D" }}>
                {SEQUENCE.map((item, i) => (
                  <div key={item.key} style={{
                    position: "absolute", inset: 0,
                    transform: slideTransform(slideStates[i]),
                    transition: slideStates[i] === "idle" ? "none" : `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }}>
                    <Image src={item.img} alt={item.caption} fill style={{ objectFit: "cover", objectPosition: "top" }} />
                  </div>
                ))}
              </div>
              {/* caption */}
              <div style={{
                position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(182,255,0,0.25)", color: "#fff",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", padding: "7px 14px",
                borderRadius: 100, whiteSpace: "nowrap", zIndex: 15,
                opacity: captionVisible ? 1 : 0, transition: "opacity 0.3s ease",
              }}>{caption}</div>
              {/* home indicator */}
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 100, height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 4, zIndex: 15 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevealSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisible(true);
    }, { threshold: 0.12 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

function AboutSection() {
  return (
    <section id="about" className="about-section" style={{ padding: "100px 5vw", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}>
      <RevealSection>
        <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2 }}>What Is Fittrybe?</span>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "1.5rem" }}>
          Connecting<br />People<br />Through <span style={{ color: "#B6FF00" }}>Sport</span>
        </h2>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(182,255,0,0.15)", border: "1px solid rgba(182,255,0,0.15)", marginTop: "2.5rem" }}>
          {[["5+","Sports"],["0","Active Now"],["∞","New Connections"],["Jan '26","Member Since"]].map(([num, label]) => (
            <div key={label} style={{ background: "#0D0D0D", padding: "1.5rem" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#B6FF00", lineHeight: 1 }}>{num}</span>
              <div style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: "0.3rem", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </RevealSection>
      <RevealSection delay={0.2} style={{ position: "relative" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(4rem, 12vw, 9rem)", fontWeight: 900, color: "rgba(255,255,255,0.03)", position: "absolute", top: "-2rem", right: "-2rem", lineHeight: 1, pointerEvents: "none", textTransform: "uppercase", letterSpacing: "-0.04em" }}>PLAY</div>
        <div style={{ fontSize: "1rem", lineHeight: 1.8, color: "#9CA3AF", maxWidth: 480 }}>
          <p>Fittrybe is a location-based social sports app built for people who want to stay active and meet others through real-world play. Whether you&apos;re new to a city, looking for casual teammates, or just want to show up and compete — we&apos;ve got you.</p>
          <p style={{ marginTop: "1rem" }}>Browse nearby sessions, reserve a spot in seconds, and get matched with people who play at your level. No team required. No commitment beyond showing up.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "2rem" }}>
          {["⚽ Football","🏀 Basketball","🏸 Badminton","🎾 Tennis","🏃 Running","🚴 Cycling","🏊 Swim","🏋️ Gym"].map(tag => (
            <span key={tag} style={{
              padding: "0.4rem 0.9rem", background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2,
              fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
              transition: "all 0.2s", cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(182,255,0,0.15)"; e.currentTarget.style.color = "#B6FF00"; e.currentTarget.style.borderColor = "rgba(182,255,0,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(182,255,0,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(182,255,0,0.15)"; }}
            >{tag}</span>
          ))}
        </div>
      </RevealSection>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: "🗺️", name: "Discover Sessions", desc: "Browse sports near you on a live map. Filter by sport, distance, date, and skill level. See what's happening within 15 miles." },
    { icon: "👥", name: "Event Group Chats", desc: "Talk to your teammates before you even arrive. Every session has a built-in group chat so you can coordinate and connect." },
    { icon: "📅", name: "My Events", desc: "Track all your upcoming sessions and sessions you're hosting in one clean view. Know your week. Show up reliably." },
    { icon: "🔔", name: "Real-Time Notifications", desc: "Know the moment someone joins your game, a new session drops nearby, or a spot opens up in a full event." },
    { icon: "🎮", name: "Host Your Own Game", desc: "Create events in minutes. Set the sport, venue, format, skill level, and team setup. Manage your roster and share with the community." },
    { icon: "⭐", name: "Reliability Score", desc: "Your attendance record matters. Build a 100% reliability rating and earn trust within your local sports community." },
  ];
  return (
    <section id="features" style={{ padding: "100px 5vw", background: "#080d08" }}>
      <RevealSection style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 4rem" }}>
        <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2 }}>Everything You Need To Play</span>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>Built For <span style={{ color: "#B6FF00" }}>Players</span></h2>
        <p style={{ color: "#9CA3AF", fontSize: "1rem" }}>Every tool you need to find, join, and host local sports sessions — all in one place.</p>
      </RevealSection>
      <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(182,255,0,0.15)", border: "1px solid rgba(182,255,0,0.15)" }}>
        {features.map((f, i) => (
          <RevealSection key={f.name} delay={[0,0.1,0.2,0.1,0.2,0.3][i]}>
            <FeatureCard {...f} />
          </RevealSection>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      background: hovered ? "#0d1a0d" : "#0f1a0f", padding: "2.5rem 2rem",
      position: "relative", overflow: "hidden", transition: "background 0.3s", cursor: "default",
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#B6FF00", transform: hovered ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 0.4s ease" }} />
      <span style={{ fontSize: "2rem", marginBottom: "1.2rem", display: "block", transform: hovered ? "scale(1.1) translateY(-4px)" : "", transition: "transform 0.3s" }}>{icon}</span>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.4rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "0.7rem" }}>{name}</div>
      <p style={{ fontSize: "0.9rem", color: "#9CA3AF", lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function HowSection() {
  return (
    <section id="how" style={{ padding: "100px 5vw", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <RevealSection>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2 }}>Simple. Social. Active.</span>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: 0 }}>3 Steps To <span style={{ color: "#B6FF00" }}>Playing</span></h2>
        </RevealSection>
        <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginTop: "4rem", position: "relative" }}>
          <div className="how-connector" style={{ position: "absolute", top: "2.5rem", left: "16.67%", right: "16.67%", height: 1, background: "linear-gradient(90deg, #B6FF00, rgba(182,255,0,0.3), #B6FF00)", zIndex: 0 }} />
          {[
            { num: "01", title: "Download & Sign Up", desc: "Create your profile in seconds. Tell us your sports and skill level. We do the rest." },
            { num: "02", title: "Explore Nearby", desc: "Find sessions by sport, distance, and time. Free sessions, all skill levels welcome." },
            { num: "03", title: "Show Up & Play", desc: "Join the group chat, meet your team, arrive and compete. Your tribe is waiting." },
          ].map(({ num, title, desc }, i) => (
            <RevealSection key={num} delay={i * 0.2} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 1.5rem" }}>
              <StepItem num={num} title={title} desc={desc} />
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", background: hovered ? "#B6FF00" : "#0D0D0D",
        border: "2px solid #B6FF00", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.2rem", fontWeight: 900,
        color: hovered ? "#0D0D0D" : "#B6FF00", marginBottom: "1.5rem", transition: "background 0.3s, color 0.3s",
      }}>{num}</div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.6rem" }}>{title}</div>
      <p style={{ fontSize: "0.88rem", color: "#9CA3AF", lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function Marquee() {
  const items = ["Football","Basketball","Badminton","Tennis","Running","Cycling","Swim","Gym","Play Local.","Football","Basketball","Badminton","Tennis","Running","Cycling","Swim","Gym","Move Together."];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(182,255,0,0.15)", borderBottom: "1px solid rgba(182,255,0,0.15)", padding: "1rem 0", margin: "3rem 0", background: "rgba(182,255,0,0.03)" }}>
      <div style={{ display: "flex", gap: "3rem", animation: "marqueeScroll 20s linear infinite", whiteSpace: "nowrap" }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: item.includes(".") ? "#B6FF00" : "#9CA3AF", flexShrink: 0 }}>{item === "Play Local." || item === "Move Together." ? item : item} {i < items.length * 2 - 1 && "·"}</span>
        ))}
      </div>
    </div>
  );
}

function CommunitySection() {
  return (
    <section id="community" style={{ padding: "100px 5vw", background: "#080d08", overflow: "hidden" }}>
      <div className="community-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>
        <RevealSection>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2 }}>Your Community Awaits</span>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "1.5rem" }}>
            Real People.<br /><span style={{ color: "#B6FF00" }}>Real Games.</span><br />Your City.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
            {[
              { text: '"Joined a badminton session my first week in Crawley. Now I play every Monday with the same crew. Fittrybe actually works."', name: "Francis O.", info: "Badminton · Crawley", initial: "F", rot: "-0.5deg" },
              { text: '"I hosted my first basketball 3v3 and had 9 players confirm within an hour. The group chat made coordination seamless."', name: "Made Easy", info: "Basketball · Redhill", initial: "M", rot: "0.3deg" },
              { text: '"As an expat I struggled to meet people. Finding a football session through Fittrybe changed that completely."', name: "Danny K.", info: "Football · Surrey", initial: "D", rot: "-0.2deg" },
            ].map(({ text, name, info, initial, rot }) => (
              <TestimonialCard key={name} text={text} name={name} info={info} initial={initial} rot={rot} />
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={0.2}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem", padding: "0.3rem 0.7rem", border: "1px solid rgba(182,255,0,0.15)", borderRadius: 2 }}>Active Sessions</span>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: 0 }}>
            Games <span style={{ color: "#B6FF00" }}>Near You</span>
          </h2>
          <div className="activity-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "2rem" }}>
            {[
              { icon: "🏸", name: "Badminton with Francis", meta: "Mon 2 Mar · 18:00 · K2 Crawley", badge: "FULL" },
              { icon: "⚽", name: "Football with Danny", meta: "Mon 2 Mar · 18:00 · Broadfield 3G", badge: "4 SPOTS" },
              { icon: "🏀", name: "Basketball 3v3", meta: "Mon 2 Mar · 18:00 · Donyngs Centre", badge: "9/10 LEFT" },
              { icon: "🎾", name: "Social Tennis Hit", meta: "Coming Soon · All Levels", badge: "OPEN" },
            ].map(({ icon, name, meta, badge }) => (
              <ActivityCard key={name} icon={icon} name={name} meta={meta} badge={badge} />
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function TestimonialCard({ text, name, info, initial, rot }: { text: string; name: string; info: string; initial: string; rot: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      background: "#0f160f", border: `1px solid ${hovered ? "rgba(182,255,0,0.4)" : "rgba(182,255,0,0.15)"}`,
      borderRadius: 4, padding: "1.5rem",
      transform: hovered ? "rotate(0) scale(1.01)" : `rotate(${rot})`,
      transition: "border-color 0.3s, transform 0.3s",
    }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.8)", marginBottom: "1rem" }}>{text}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <div style={{ width: 36, height: 36, background: "#B6FF00", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#0D0D0D" }}>{initial}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{name}</div>
          <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{info}</div>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ icon, name, meta, badge }: { icon: string; name: string; meta: string; badge: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      background: "#0d1a0d", border: `1px solid ${hovered ? "rgba(182,255,0,0.35)" : "rgba(182,255,0,0.15)"}`,
      borderRadius: 4, padding: "1rem", transform: hovered ? "translateY(-4px)" : "", transition: "transform 0.2s, border-color 0.2s",
    }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span style={{ fontSize: "1.4rem", marginBottom: "0.5rem", display: "block" }}>{icon}</span>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.3 }}>{name}</div>
      <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.3rem" }}>{meta}</div>
      <span style={{ display: "inline-block", marginTop: "0.5rem", padding: "0.2rem 0.5rem", background: "rgba(182,255,0,0.12)", color: "#B6FF00", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", borderRadius: 2 }}>{badge}</span>
    </div>
  );
}

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (!email || !email.includes("@")) { setError(true); setTimeout(() => setError(false), 1000); return; }
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section id="waitlist" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden", padding: "100px 5vw" }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(182,255,0,0.012) 60px, rgba(182,255,0,0.012) 62px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 700, height: 700, background: "radial-gradient(circle, rgba(182,255,0,0.1) 0%, transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <RevealSection style={{ position: "relative", zIndex: 2, maxWidth: 600, width: "100%" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B6FF00", marginBottom: "1rem" }}>⚡ Launching Soon</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          Be First<br />To <span style={{ color: "#B6FF00" }}>Play.</span>
        </h2>
        <p style={{ color: "#9CA3AF", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
          We&apos;re launching soon. Join 300+ people already on the waitlist and get early access when we go live in your city.
        </p>
        <div className="waitlist-form" style={{
          display: "flex", gap: 0, maxWidth: 440, margin: "0 auto 1rem",
          border: `1px solid ${error ? "#ff4444" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 4, overflow: "hidden", transition: "border-color 0.3s",
        }}>
          <input
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", padding: "0.9rem 1.2rem", color: "#fff", fontFamily: "'Barlow', sans-serif", fontSize: "0.95rem", outline: "none", minWidth: 0 }}
          />
          <button onClick={handleSubmit} style={{
            background: submitted ? "#6aff00" : "#B6FF00", border: "none", padding: "0.9rem 1.5rem",
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.95rem", fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase", color: "#0D0D0D", cursor: "pointer", whiteSpace: "nowrap",
          }}>{submitted ? "✓ You're in!" : "Join →"}</button>
        </div>
        <p style={{ fontSize: "0.78rem", color: submitted ? "#B6FF00" : "#9CA3AF" }}>
          {submitted ? "🎉 Welcome to the tribe! We'll be in touch soon." : "Free to join. No spam. Cancel anytime."}
        </p>
      </RevealSection>
    </section>
  );
}

function DownloadSection() {
  return (
    <div id="download" className="download-section" style={{ background: "#080d08", padding: "80px 5vw", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "3rem", borderTop: "1px solid rgba(182,255,0,0.15)", flexWrap: "wrap" }}>
      <RevealSection>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, marginBottom: "0.5rem" }}>Get The App</h2>
        <p style={{ color: "#9CA3AF", fontSize: "0.95rem" }}>Available on iOS and Android. Download and find your first game today.</p>
        <div className="store-buttons" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          {[
            { icon: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z", small: "Download on the", strong: "App Store" },
            { icon: "M3.18 23.76c.3.17.64.22.98.14l12.5-7.08-2.54-2.54-10.94 9.48zm-1.1-20.3C2.03 3.76 2 4.07 2 4.41v15.18c0 .34.03.65.09.94l10.12-10.12-10.13-7.95zm19.08 8.94l-2.48-1.41-2.82 2.82 2.82 2.82 2.5-1.42c.71-.4.71-1.41-.02-1.81zM4.16.38l12.5 7.08-2.54 2.54L3.18.52C3.54.44 3.9.5 4.16.38z", small: "Get it on", strong: "Google Play" },
          ].map(({ icon, small, strong }) => (
            <a key={strong} href="#" style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.75rem 1.4rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
              textDecoration: "none", color: "#fff", transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#B6FF00"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = ""; }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff"><path d={icon} /></svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <small style={{ fontSize: "0.65rem", color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}>{small}</small>
                <strong style={{ fontSize: "0.95rem", fontWeight: 700 }}>{strong}</strong>
              </div>
            </a>
          ))}
        </div>
      </RevealSection>
      <RevealSection delay={0.2}>
        <div className="download-phone" style={{ width: 200, borderRadius: 32, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)", transform: "rotate(-3deg)", animation: "floatB 5s ease-in-out infinite" }}>
          <Image src="/images/screen1.jpg" alt="Fittrybe app" width={200} height={400} style={{ width: "100%", display: "block" }} />
        </div>
      </RevealSection>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer" style={{ padding: "3rem 5vw", borderTop: "1px solid rgba(182,255,0,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
      <a href="#" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.4rem", letterSpacing: "-0.02em", textDecoration: "none" }}>
        <span style={{ color: "#fff" }}>fit</span><span style={{ color: "#B6FF00" }}>trybe</span>
      </a>
      <div className="footer-links" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {["Privacy Policy", "Terms", "Contact", "FAQ"].map(link => (
          <a key={link} href="#" style={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.82rem", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#B6FF00")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
          >{link}</a>
        ))}
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        {["IG", "TW", "TK"].map(s => (
          <a key={s} href="#" style={{
            width: 36, height: 36, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
            color: "#9CA3AF", fontSize: "0.85rem", transition: "border-color 0.2s, color 0.2s",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#B6FF00"; e.currentTarget.style.color = "#B6FF00"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#9CA3AF"; }}
          >{s}</a>
        ))}
      </div>
    </footer>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0D0D0D; color: #fff; font-family: 'Barlow', sans-serif; overflow-x: hidden; }
  body::before {
    content: ''; position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.025; pointer-events: none; z-index: 1000;
  }

  /* ─── Keyframes ─── */
  @keyframes glowPulse { 0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes slideUp { to { transform: translateY(0); } }
  @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }
  @keyframes floatA { 0%,100%{transform:translate(-70%,-50%) rotate(-6deg) translateY(0)} 50%{transform:translate(-70%,-50%) rotate(-6deg) translateY(-12px)} }
  @keyframes floatB { 0%,100%{transform:translate(-30%,-50%) rotate(4deg) translateY(0)} 50%{transform:translate(-30%,-50%) rotate(4deg) translateY(-18px)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  @keyframes float1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
  @keyframes marqueeScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

  /* ─── Tablet: 768px–1024px ─── */
  @media (max-width: 1024px) {
    /* Hero: stack on tablet */
    .hero-section {
      grid-template-columns: 1fr !important;
      padding: 100px 6vw 60px !important;
      text-align: center;
      justify-items: center;
    }
    .hero-section > div:first-child {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hero-phones {
      display: none !important;
    }

    /* About section */
    .about-section {
      grid-template-columns: 1fr !important;
      gap: 3rem !important;
    }

    /* Features grid: 2 columns */
    .features-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    /* Phone carousel: stack */
    .phone-carousel-grid {
      grid-template-columns: 1fr !important;
      gap: 3rem;
    }
    .phone-carousel-section {
      padding: 80px 6vw !important;
    }
    .phone-right {
      min-height: 500px !important;
    }

    /* How grid: keep 3 cols but hide connector */
    .how-connector { display: none !important; }

    /* Community */
    .community-grid {
      grid-template-columns: 1fr !important;
      gap: 3rem !important;
    }

    /* Activity grid */
    .activity-grid {
      grid-template-columns: 1fr 1fr !important;
    }

    /* Download */
    .download-section {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .download-phone { display: none !important; }
  }

  /* ─── Mobile: max 768px ─── */
  @media (max-width: 768px) {
    /* Navbar */
    .desktop-nav { display: none !important; }
    .hamburger { display: flex !important; }
    .mobile-menu { display: flex !important; }

    /* Hero */
    .hero-section {
      padding: 90px 5vw 50px !important;
      min-height: auto !important;
    }

    /* Stats bar */
    .stats-bar {
      grid-template-columns: 1fr !important;
    }
    .stats-bar > div {
      border-right: none !important;
      border-bottom: 1px solid rgba(182,255,0,0.15);
      padding: 1.5rem 0 !important;
    }
    .stats-bar > div:last-child {
      border-bottom: none !important;
    }

    /* Phone carousel */
    .phone-carousel-grid {
      grid-template-columns: 1fr !important;
    }
    .phone-carousel-section {
      padding: 60px 5vw !important;
      min-height: auto !important;
    }
    .phone-right {
      min-height: 420px !important;
    }

    /* Features */
    .features-grid {
      grid-template-columns: 1fr !important;
    }

    /* How steps: stack */
    .how-grid {
      grid-template-columns: 1fr !important;
      gap: 2.5rem !important;
    }
    .how-connector { display: none !important; }

    /* Community */
    .community-grid {
      grid-template-columns: 1fr !important;
      gap: 3rem !important;
    }

    /* Activity grid: 1 column */
    .activity-grid {
      grid-template-columns: 1fr !important;
    }

    /* About */
    .about-section {
      grid-template-columns: 1fr !important;
      gap: 3rem !important;
      padding: 60px 5vw !important;
    }
    .stats-grid {
      grid-template-columns: 1fr 1fr !important;
    }

    /* Download */
    .download-section {
      flex-direction: column !important;
      padding: 60px 5vw !important;
    }
    .download-phone { display: none !important; }
    .store-buttons {
      flex-direction: column !important;
      align-items: flex-start !important;
    }

    /* Waitlist form */
    .waitlist-form {
      flex-direction: column !important;
      border-radius: 8px !important;
      overflow: visible !important;
      border: none !important;
      gap: 0.75rem !important;
    }
    .waitlist-form input {
      border: 1px solid rgba(255,255,255,0.12) !important;
      border-radius: 4px !important;
      width: 100% !important;
    }
    .waitlist-form button {
      border-radius: 4px !important;
      width: 100% !important;
      padding: 1rem !important;
    }

    /* Footer */
    .footer {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1.5rem !important;
    }
    .footer-links {
      gap: 1rem !important;
    }

    /* General padding */
    section {
      padding-left: 5vw !important;
      padding-right: 5vw !important;
    }
  }

  /* ─── Small mobile: max 480px ─── */
  @media (max-width: 480px) {
    .phone-right {
      min-height: 380px !important;
    }
    .stats-grid {
      grid-template-columns: 1fr !important;
    }
    .activity-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <PhoneCarousel />
      <AboutSection />
      <FeaturesSection />
      <HowSection />
      <Marquee />
      <CommunitySection />
      <WaitlistSection />
      <DownloadSection />
      <Footer />
    </>
  );
}