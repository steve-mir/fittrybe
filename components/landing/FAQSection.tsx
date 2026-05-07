/**
 * ─── FAQSection ───────────────────────────────────────────────────────────────
 * Visible counterpart to the FAQPage JSON-LD injected from app/page.tsx.
 * Loaded as a dynamic chunk — it's at the bottom of the page and only
 * needs to ship once the user scrolls there.
 */
"use client";

import { useState } from "react";

function IconChevronDown({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function FAQSection({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (!faqs?.length) return null;

  return (
    <section
      aria-label="Frequently asked questions"
      style={{
        padding: "80px 5vw",
        maxWidth: 880,
        margin: "0 auto",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span
          style={{
            display: "inline-block",
            color: "#B6FF00",
            fontSize: "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          FAQ
        </span>
        <h2
          style={{
            fontFamily: "var(--font-anton, 'Anton', sans-serif)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            color: "#fff",
            lineHeight: 1.05,
          }}
        >
          Questions, answered.
        </h2>
      </header>

      <dl style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          const panelId = `faq-panel-${i}`;
          const buttonId = `faq-button-${i}`;
          return (
            <div className="faq-item" key={faq.question}>
              <dt>
                <button
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1.4rem 0",
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    letterSpacing: "0.01em",
                    textTransform: "uppercase",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      color: "#B6FF00",
                      flexShrink: 0,
                    }}
                  >
                    <IconChevronDown size={18} />
                  </span>
                </button>
              </dt>
              <dd
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                style={{
                  padding: isOpen ? "0 0 1.4rem 0" : 0,
                  color: "#9CA3AF",
                  fontSize: "0.92rem",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {faq.answer}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
