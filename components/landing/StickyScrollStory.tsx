/**
 * ─── StickyScrollStory ────────────────────────────────────────────────────────
 * Below-the-fold scroll-driven section. Loaded as a dynamic chunk so framer-
 * motion's useScroll/useTransform/useMotionValueEvent stay out of the
 * initial-paint bundle.
 */
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

const SCROLL_SLIDES = [
  {
    label: "01",
    word: "EXPLORE",
    sub: "Find sports sessions near you",
    img: "/images/explore.jpg",
    desc: "Browse live local sessions by sport, distance, and time. See who's playing, where, and when.",
  },
  {
    label: "02",
    word: "CONNECT",
    sub: "Meet your local sports tribe",
    img: "/images/connect.jpg",
    desc: "Chat with players, build your network, and find people who share your playing style and schedule.",
  },
  {
    label: "03",
    word: "PLAY",
    sub: "Show up and stay active",
    img: "/images/play.jpg",
    desc: "Reserve your spot, show up, play sport, and build the active routine you've always wanted.",
  },
];

export default function StickyScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [activeSlide, setActiveSlide] = useState(0);

  // Section is 300svh; with offset ["start start", "end end"] the effective
  // scroll range = 200svh. Phases are equal fifths (40svh each) so every
  // slide-to-next transition feels identical.
  //
  // IMPORTANT: each opacity transform is a function (not an input/output
  // array). When useTransform is given a function, framer-motion skips its
  // GPU-accelerated CSS scroll-driven animations path and uses the JS
  // interpolation path that Firefox always uses. On Chromium that array path
  // proved brittle with sticky + svh + `contain` range — progress sometimes
  // never reached the slide-3 threshold reliably. The function form makes
  // behavior identical across browsers. Do not refactor back to array form.
  const opacity0 = useTransform(scrollYProgress, (v) => {
    if (v <= 0.20) return 1;
    if (v >= 0.40) return 0;
    return 1 - (v - 0.20) / 0.20;
  });
  const opacity1 = useTransform(scrollYProgress, (v) => {
    if (v <= 0.20 || v >= 0.80) return 0;
    if (v <= 0.40) return (v - 0.20) / 0.20;
    if (v <= 0.60) return 1;
    return 1 - (v - 0.60) / 0.20;
  });
  const opacity2 = useTransform(scrollYProgress, (v) => {
    if (v <= 0.60) return 0;
    if (v >= 0.80) return 1;
    return (v - 0.60) / 0.20;
  });
  const opacities = [opacity0, opacity1, opacity2];

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.30) setActiveSlide(0);
    else if (v < 0.70) setActiveSlide(1);
    else setActiveSlide(2);
  });

  return (
    <section
      id="how-it-works"
      aria-label="How Fittrybe works — explore, connect, play"
      ref={containerRef}
      style={{ height: "300svh", position: "relative" }}
    >
      <div
        className="sticky-inner"
        style={{
          position: "sticky",
          top: 0,
          // svh matches the visible viewport regardless of mobile-browser URL-bar state.
          // Using vh on Chromium mobile renders this taller than the visible area, which
          // causes the section to release before scrollYProgress reaches 1.0 — slide 3
          // then gets clipped out as the page scrolls into the next section.
          height: "100svh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#050505",
        }}
      >
        <div
          className="sticky-left"
          style={{
            position: "relative",
            flex: "0 0 50%",
            paddingLeft: "5vw",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          {SCROLL_SLIDES.map((slide, i) => (
            <motion.div
              key={slide.label}
              style={{ opacity: opacities[i], position: "absolute", pointerEvents: "none", willChange: "opacity" }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                  fontWeight: 900,
                  fontSize: "clamp(4rem, 10vw, 9rem)",
                  lineHeight: 0.88,
                  textTransform: "uppercase",
                  letterSpacing: "-0.03em",
                  color: "#fff",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "0.32em",
                    color: "#B6FF00",
                    marginBottom: "0.5rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {slide.label}
                </span>
                {slide.word}
                <span
                  style={{
                    display: "block",
                    fontSize: "0.22em",
                    color: "#4B5563",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginTop: "0.8rem",
                    fontFamily: "var(--font-inter-tight, sans-serif)",
                  }}
                >
                  {slide.sub}
                </span>
              </h2>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: 1.6,
                  maxWidth: 360,
                  marginTop: "1.5rem",
                  fontFamily: "var(--font-inter-tight, sans-serif)",
                }}
              >
                {slide.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div
          className="sticky-right"
          style={{
            flex: "0 0 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            height: "100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              background:
                "radial-gradient(circle, rgba(255,100,20,0.1) 0%, rgba(182,255,0,0.04) 50%, transparent 65%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              filter:
                "drop-shadow(0 40px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(255,95,20,0.2))",
              position: "relative",
            }}
          >
            <div
              className="sticky-phone-outer"
              style={{
                width: 260,
                height: 540,
                background:
                  "linear-gradient(160deg, #FF8040 0%, #E85A10 30%, #C94810 55%, #FF6A20 80%, #FF9050 100%)",
                borderRadius: 48,
                padding: "2px",
                boxShadow:
                  "inset 0 1px 0 rgba(255,200,150,0.5), inset 0 -1px 0 rgba(100,30,0,0.4)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -3,
                  top: 108,
                  width: 3,
                  height: 32,
                  background: "linear-gradient(to right, #C94810, #E86020)",
                  borderRadius: "2px 0 0 2px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -3,
                  top: 152,
                  width: 3,
                  height: 32,
                  background: "linear-gradient(to right, #C94810, #E86020)",
                  borderRadius: "2px 0 0 2px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: -3,
                  top: 136,
                  width: 3,
                  height: 54,
                  background: "linear-gradient(to left, #C94810, #E86020)",
                  borderRadius: "0 2px 2px 0",
                }}
              />

              <div
                className="sticky-phone-inner"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#0d0d0d",
                  borderRadius: 46,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                  WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                  transform: "translateZ(0)",
                }}
              >
                {SCROLL_SLIDES.map((slide, i) => (
                  <motion.div
                    key={slide.img + i}
                    style={{ position: "absolute", inset: 0, opacity: opacities[i], willChange: "opacity" }}
                  >
                    <Image
                      src={slide.img}
                      alt={`Fittrybe app screen — ${slide.sub}`}
                      fill
                      sizes="260px"
                      style={{ objectFit: "cover", objectPosition: "top" }}
                    />
                  </motion.div>
                ))}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
                    borderRadius: 46,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 80,
                    height: 4,
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: 4,
                    zIndex: 15,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Slide indicator"
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 10,
            zIndex: 20,
          }}
        >
          {SCROLL_SLIDES.map((slide, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={i === activeSlide}
              aria-label={`Slide ${i + 1}: ${slide.word}`}
              style={{
                width: i === activeSlide ? 24 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeSlide ? "#B6FF00" : "rgba(255,255,255,0.15)",
                transition: "width 0.4s ease, background 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
