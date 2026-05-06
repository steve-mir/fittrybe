import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = {
  title: "Account Deleted — Fittrybe",
  robots: { index: false, follow: false },
};

export default function AccountDeletedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 5vw 60px",
        fontFamily: "var(--font-inter-tight, 'Inter Tight', sans-serif)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Wordmark height={30} />
        </div>

        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "3rem 2.5rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(182,255,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B6FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-anton, 'Anton', sans-serif)",
              fontWeight: 900,
              fontSize: "clamp(1.75rem, 5vw, 2.25rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Account <span style={{ color: "#B6FF00" }}>Deleted</span>
          </h1>

          <p style={{ fontSize: "0.92rem", color: "#9CA3AF", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            Your Fittrybe account and all associated data have been permanently
            removed. We're sorry to see you go.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#B6FF00",
              color: "#0D0D0D",
              padding: "0.85rem 1.75rem",
              borderRadius: 8,
              textDecoration: "none",
              fontFamily: "var(--font-anton, 'Anton', sans-serif)",
              fontSize: "0.95rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
