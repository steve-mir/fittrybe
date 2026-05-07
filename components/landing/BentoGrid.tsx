/**
 * ─── BentoGrid ────────────────────────────────────────────────────────────────
 * Below-the-fold features grid. Loaded as a dynamic chunk so:
 *   • framer-motion stays out of the initial bundle
 *   • Supabase realtime subscription only initialises when the section is needed
 *
 * Counter is driven by requestAnimationFrame instead of a 28 ms setInterval —
 * the old approach woke the main thread ~36×/s for ~1.7 s on every count-up.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

function IconApple({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
function IconGooglePlay({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z" />
    </svg>
  );
}

function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || triggered.current) return;
        triggered.current = true;
        const duration = 1400; // ms — single rAF-driven sweep
        const startTime = performance.now();
        let raf = 0;
        const tick = (now: number) => {
          const t = Math.min(1, (now - startTime) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(target * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
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

export default function BentoGrid() {
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from("waitlist")
          .select("*", { count: "exact", head: true });
        if (!cancelled) setWaitlistCount(count || 0);
      } catch (error) {
        console.error("Error fetching waitlist count:", error);
      }
    };
    fetchCount();
    const channel = supabase
      .channel("waitlist-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist" },
        () => fetchCount()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section
      aria-label="Fittrybe features and stats"
      style={{ padding: "100px 5vw", background: "#050505" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: "3rem", textAlign: "center" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-anton, 'Anton', sans-serif)",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          BUILT FOR <span style={{ color: "#B6FF00" }}>PLAYERS</span>
        </h2>
      </motion.div>

      <div
        className="bento-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "auto auto",
          gap: 14,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <motion.article
          className="bento-card"
          aria-label="Waitlist and launch stats"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0 }}
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 3",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 400,
            background: "linear-gradient(145deg, #0D0D0D 0%, #111 100%)",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#B6FF00",
                marginBottom: "1rem",
              }}
            >
              ● LIVE COUNT
            </p>
            <p
              style={{
                fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                fontSize: "clamp(3.5rem, 6vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#fff",
              }}
            >
              <AnimatedCount target={waitlistCount + 100 || 240} suffix="+" />
            </p>
            <p style={{ fontSize: "0.85rem", color: "#4B5563", fontWeight: 500, marginTop: "0.5rem" }}>
              Players on the waitlist
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { num: "5+", label: "Sports & growing" },
              { num: "FREE", label: "To join & play" },
              { num: "2026", label: "Launch target" },
            ].map(({ num, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#B6FF00",
                  }}
                >
                  {num}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#4B5563",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          className="bento-card"
          aria-label="Sports supported by Fittrybe"
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
          <h3
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#B6FF00",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            ● SPORTS
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
            role="list"
            aria-label="Supported sports"
          >
            {SPORT_EMOJIS.map(({ emoji, label, delay }) => (
              <motion.div
                key={label}
                className="sport-icon-float"
                role="listitem"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay }}
                style={{ width: 60, height: 60 }}
                aria-label={label}
                title={label}
              >
                <span style={{ fontSize: "1.6rem" }} role="img" aria-label={label}>
                  {emoji}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.article>

        <motion.article
          className="bento-card"
          aria-label="Download Fittrybe on the App Store and Google Play"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            gridColumn: "2 / 4",
            padding: "2.5rem",
            background: "linear-gradient(135deg, #0f1a00 0%, #0D0D0D 60%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#B6FF00",
                  marginBottom: "0.75rem",
                }}
              >
                ● COMING SOON
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                GET THE APP
              </h3>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <a
                href="/waitlist"
                className="store-btn"
                aria-label="Join waitlist for Fittrybe on the App Store"
                style={{ flex: "0 1 auto", minWidth: "160px" }}
              >
                <IconApple size={20} color="#fff" />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "#9CA3AF",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                    }}
                  >
                    DOWNLOAD ON THE
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>App Store</div>
                </div>
              </a>
              <a
                href="/waitlist"
                className="store-btn"
                aria-label="Join waitlist for Fittrybe on Google Play"
                style={{ flex: "0 1 auto", minWidth: "160px" }}
              >
                <IconGooglePlay size={20} color="#B6FF00" />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "#9CA3AF",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                    }}
                  >
                    GET IT ON
                  </div>
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
