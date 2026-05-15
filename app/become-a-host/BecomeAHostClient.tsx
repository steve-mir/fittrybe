/**
 * ─── /become-a-host ───────────────────────────────────────────────────────────
 * Three-step flow:
 *   Step 1 — Benefits + Apply CTA (no auth required)
 *   Step 2 — Sign-in (if not authenticated) + Application form →
 *            POST /api/become-a-host/apply → on success, advance to step 3.
 *   Step 3 — "Application received" confirmation; we'll review and email
 *            an activation link if approved.
 *
 * No payment is taken on this page. Verified-host membership (£9.99/mo)
 * kicks in only after an admin approves the application and the applicant
 * follows the activation link emailed to them.
 *
 * Design language matches the landing page: Anton display font,
 * lemon green #B6FF00 accent, dark #050505 background, fadeUp animations,
 * Wordmark in nav, single-card focal layout (mirrors /account/delete).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const PAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050505; color: #fff; font-family: var(--font-inter-tight, 'Inter Tight', sans-serif); min-height: 100vh; overflow-x: hidden; }

  @keyframes bahFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bahShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  @keyframes bahGlowPulse { 0%,100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); } }
  @keyframes bahBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .bah-fade { animation: bahFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-1 { animation: bahFadeUp 0.55s 0.05s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-2 { animation: bahFadeUp 0.55s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-3 { animation: bahFadeUp 0.55s 0.25s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-fade-4 { animation: bahFadeUp 0.55s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  .bah-shake { animation: bahShake 0.5s ease; }

  .bah-benefit {
    display: flex; align-items: flex-start; gap: 1rem;
    padding: 1.25rem 1.25rem;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    background: linear-gradient(145deg, #0D0D0D 0%, #111 100%);
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), border-color 0.25s, box-shadow 0.25s;
  }
  .bah-benefit:hover {
    transform: translateY(-3px);
    border-color: rgba(182,255,0,0.3);
    box-shadow: 0 0 32px rgba(182,255,0,0.06), 0 18px 40px rgba(0,0,0,0.45);
  }
  .bah-benefit-icon {
    width: 44px; height: 44px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 11px;
    background: rgba(182,255,0,0.08);
    border: 1px solid rgba(182,255,0,0.18);
    color: #B6FF00;
  }

  .bah-cta {
    width: 100%;
    background: #B6FF00;
    color: #0D0D0D;
    border: none;
    border-radius: 10px;
    padding: 1.05rem 1.5rem;
    font-family: var(--font-anton, 'Anton', sans-serif);
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .bah-cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(182,255,0,0.28); }
  .bah-cta:disabled { cursor: not-allowed; opacity: 0.6; }

  .bah-ghost-btn {
    width: 100%;
    background: transparent;
    color: #9CA3AF;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    font-family: var(--font-inter-tight, 'Inter Tight', sans-serif);
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .bah-ghost-btn:hover { border-color: rgba(255,255,255,0.25); color: #fff; }

  .bah-input {
    width: 100%;
    background: #111;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    color: #fff;
    font-family: var(--font-inter-tight, 'Inter Tight', sans-serif);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .bah-input:focus { border-color: rgba(182,255,0,0.4); }
  .bah-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #111 inset !important; -webkit-text-fill-color: #fff !important; }

  .bah-textarea {
    width: 100%;
    min-height: 110px;
    resize: vertical;
    background: #111;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    color: #fff;
    font-family: var(--font-inter-tight, 'Inter Tight', sans-serif);
    font-size: 0.95rem;
    line-height: 1.55;
    outline: none;
    transition: border-color 0.2s;
  }
  .bah-textarea:focus { border-color: rgba(182,255,0,0.4); }

  .bah-hint {
    font-size: 0.72rem;
    color: #4B5563;
    margin-top: 0.35rem;
  }

  .bah-label {
    display: block;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4B5563;
    margin-bottom: 0.4rem;
  }

  .bah-step-back {
    display: inline-flex; align-items: center; gap: 0.4rem;
    color: #6B7280; background: transparent; border: none;
    font-size: 0.82rem; font-weight: 600; letter-spacing: 0.03em;
    cursor: pointer; padding: 0; margin-bottom: 1.25rem;
    transition: color 0.2s;
  }
  .bah-step-back:hover { color: #B6FF00; }

  .bah-summary-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 0;
    border-top: 1px solid rgba(255,255,255,0.05);
    font-size: 0.88rem;
  }
  .bah-summary-row:first-child { border-top: none; }

  :focus-visible { outline: 2px solid #B6FF00; outline-offset: 3px; border-radius: 4px; }

  /* Responsive */
  @media (max-width: 768px) {
    .bah-hero-headline { font-size: clamp(2.5rem, 9vw, 3.5rem) !important; }
    .bah-shell { padding: 90px 5vw 60px !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ─── Icons ─────────────────────────────────────────────────────────────── */
function IconArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconShield({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconCalendar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconWallet({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function IconStar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconUsers({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconBolt({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconLock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.97H.96a9 9 0 0 0 0 8.06l3-2.32z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33A5.36 5.36 0 0 1 9 3.58z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/* ─── Benefits content ──────────────────────────────────────────────────── */
const BENEFITS: Array<{
  icon: React.ReactNode;
  title: string;
  body: string;
}> = [
  {
    icon: <IconCalendar />,
    title: "Host unlimited sessions",
    body: "Create football, basketball, tennis, cycling, gym & more. Run recurring sessions, set capacity, and build your regular crew.",
  },
  {
    icon: <IconShield />,
    title: "Verified host badge",
    body: "Stand out with the lemon-green tick. Players trust verified hosts more — and that translates to faster fills.",
  },
  {
    icon: <IconWallet />,
    title: "Get paid through Fittrybe",
    body: "Players pay in-app, you receive payouts to your wallet. Stripe handles the boring bits — you just show up and play.",
  },
  {
    icon: <IconUsers />,
    title: "Manage your community",
    body: "Group chats per session, automatic reminders, attendance tracking, no-show strikes. Less chasing, more playing.",
  },
  {
    icon: <IconBolt />,
    title: "Priority discovery",
    body: "Verified-host sessions get boosted in search and the home feed, putting your trybe in front of the right players first.",
  },
  {
    icon: <IconStar />,
    title: "Player ratings & MVP",
    body: "Build a public host rating, run polls, hand out MVPs, and track your community's reliability — all in one place.",
  },
];

type Step = "benefits" | "application" | "submitted";

export default function BecomeAHostClient() {
  // Lazy initializer so we hydrate straight to the right step when the user
  // arrives with ?step=application (e.g. after an OAuth round-trip).
  // `?step=checkout` is still honoured for any stale links floating around.
  const [step, setStep] = useState<Step>(() => {
    if (typeof window === "undefined") return "benefits";
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("step");
    if (raw === "application" || raw === "checkout") return "application";
    return "benefits";
  });
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Sign-in form (shown only when step=application AND user is not authenticated)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);

  // Application form
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [primarySport, setPrimarySport] = useState("");
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      triggerShake();
      return;
    }
    setSigningIn(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSigningIn(false);
    if (err) {
      setError(err.message);
      triggerShake();
      return;
    }
    setPassword("");
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthBusy(provider);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/become-a-host?step=application` },
    });
    if (err) {
      setOauthBusy(null);
      setError(err.message);
      triggerShake();
    }
  }

  async function handleSubmitApplication() {
    if (!user) {
      setError("Please sign in first.");
      triggerShake();
      return;
    }
    if (!fullName.trim() || !city.trim() || !primarySport.trim() || !motivation.trim()) {
      setError("Please fill in your name, city, primary sport, and why you want to host.");
      triggerShake();
      return;
    }

    setError(null);
    setSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setSubmitting(false);
      setError("Your session expired. Sign in again.");
      setUser(null);
      return;
    }

    try {
      const res = await fetch("/api/become-a-host/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: fullName.trim(),
          city: city.trim(),
          primary_sport: primarySport.trim(),
          experience: experience.trim(),
          motivation: motivation.trim(),
          social_url: socialUrl.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitting(false);
        setError(body?.error ?? "Could not submit your application. Please try again.");
        triggerShake();
        return;
      }
      setSubmitting(false);
      setStep("submitted");
      // Scroll to top so users see the confirmation banner first.
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError("Network error. Please try again.");
      triggerShake();
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* ── Top bar (logo + back link) ─────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "1.25rem 5vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(5,5,5,0.7)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Link
          href="/"
          aria-label="Fittrybe — return to homepage"
          style={{ display: "flex", alignItems: "center", gap: "0.55rem", textDecoration: "none" }}
        >
          <Image src="/logo-mark.png" alt="" width={28} height={28} priority style={{ display: "block" }} />
          <Wordmark height={22} />
        </Link>
        <Link
          href="/"
          style={{
            color: "#6B7280",
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          ← Back
        </Link>
      </header>

      <main className="bah-shell" style={{ minHeight: "100vh", padding: "120px 5vw 80px", position: "relative", overflow: "hidden" }}>
        {/* Decorative glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            background: "radial-gradient(circle, rgba(182,255,0,0.06) 0%, transparent 70%)",
            top: "10%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            animation: "bahGlowPulse 5s ease-in-out infinite",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto" }}>
          {step === "benefits" ? <BenefitsStep onContinue={() => setStep("application")} /> : null}

          {step === "application" ? (
            <ApplicationStep
              shake={shake}
              user={user}
              checkingSession={checkingSession}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              signingIn={signingIn}
              oauthBusy={oauthBusy}
              submitting={submitting}
              error={error}
              fullName={fullName}
              setFullName={setFullName}
              city={city}
              setCity={setCity}
              primarySport={primarySport}
              setPrimarySport={setPrimarySport}
              experience={experience}
              setExperience={setExperience}
              motivation={motivation}
              setMotivation={setMotivation}
              socialUrl={socialUrl}
              setSocialUrl={setSocialUrl}
              onBack={() => {
                setError(null);
                setStep("benefits");
              }}
              onSignIn={handleSignIn}
              onOAuth={handleOAuth}
              onSubmit={handleSubmitApplication}
              onSignOut={async () => {
                await supabase.auth.signOut();
              }}
            />
          ) : null}

          {step === "submitted" ? (
            <SubmittedStep userEmail={user?.email ?? null} />
          ) : null}
        </div>
      </main>
    </>
  );
}

/* ─── Step 1: Benefits ──────────────────────────────────────────────────── */
function BenefitsStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div>
      {/* Pill */}
      <div
        className="bah-fade"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(182,255,0,0.08)",
          border: "1px solid rgba(182,255,0,0.2)",
          borderRadius: 100,
          padding: "6px 16px",
          marginBottom: "1.5rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#B6FF00",
        }}
      >
        <span style={{ width: 6, height: 6, background: "#B6FF00", borderRadius: "50%", animation: "bahBlink 1.5s infinite" }} aria-hidden="true" />
        Apply to be a Verified Host
      </div>

      <h1
        className="bah-hero-headline bah-fade-1"
        style={{
          fontFamily: "var(--font-anton, 'Anton', sans-serif)",
          fontWeight: 900,
          fontSize: "clamp(3rem, 7vw, 5.5rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
          maxWidth: 900,
        }}
      >
        Run the games. <span style={{ color: "#B6FF00" }}>Build your trybe.</span>
      </h1>

      <p
        className="bah-fade-2"
        style={{
          fontSize: "1.05rem",
          color: "#9CA3AF",
          lineHeight: 1.7,
          maxWidth: 620,
          marginBottom: "3rem",
        }}
      >
        Verified hosts get the tools, the trust, and the reach to run great sessions consistently.
        Tell us a bit about you and the games you want to run — if it&apos;s a fit, we&apos;ll email you
        an activation link.
      </p>

      {/* Benefits grid */}
      <div
        className="bah-fade-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: "3rem",
        }}
      >
        {BENEFITS.map((b) => (
          <article key={b.title} className="bah-benefit">
            <span className="bah-benefit-icon" aria-hidden="true">{b.icon}</span>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                  color: "#fff",
                  marginBottom: "0.4rem",
                  lineHeight: 1.2,
                }}
              >
                {b.title}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#9CA3AF", lineHeight: 1.6 }}>{b.body}</p>
            </div>
          </article>
        ))}
      </div>

      {/* CTA + apply strip */}
      <div
        className="bah-fade-4"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          padding: "2.25rem 1.5rem",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          background: "linear-gradient(145deg, #0D0D0D 0%, #0a0a0a 100%)",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-anton, 'Anton', sans-serif)",
              fontSize: "clamp(1.6rem, 3.5vw, 2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Free to apply
          </p>
          <p style={{ fontSize: "0.82rem", color: "#6B7280", marginTop: "0.6rem", lineHeight: 1.5 }}>
            Takes about 2 minutes. Approved hosts pay £9.99/month after activation —
            cancel anytime, no setup fees.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          aria-label="Start your host application"
          className="bah-cta"
        >
          Start application <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Auth + Application form ──────────────────────────────────── */
function ApplicationStep(props: {
  shake: boolean;
  user: User | null;
  checkingSession: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  signingIn: boolean;
  oauthBusy: "google" | "apple" | null;
  submitting: boolean;
  error: string | null;
  fullName: string;
  setFullName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  primarySport: string;
  setPrimarySport: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  motivation: string;
  setMotivation: (v: string) => void;
  socialUrl: string;
  setSocialUrl: (v: string) => void;
  onBack: () => void;
  onSignIn: () => void;
  onOAuth: (provider: "google" | "apple") => void;
  onSubmit: () => void;
  onSignOut: () => void;
}) {
  const {
    shake, user, checkingSession,
    email, setEmail, password, setPassword,
    signingIn, oauthBusy, submitting, error,
    fullName, setFullName, city, setCity,
    primarySport, setPrimarySport,
    experience, setExperience,
    motivation, setMotivation,
    socialUrl, setSocialUrl,
    onBack, onSignIn, onOAuth, onSubmit, onSignOut,
  } = props;

  const signedIn = !!user;

  return (
    <div className={`bah-fade ${shake ? "bah-shake" : ""}`} style={{ maxWidth: 560, margin: "0 auto" }}>
      <button type="button" className="bah-step-back" onClick={onBack} aria-label="Back to benefits">
        ← Back
      </button>

      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "2.25rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-anton, 'Anton', sans-serif)",
            fontWeight: 900,
            fontSize: "clamp(1.7rem, 4.5vw, 2.25rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          {signedIn ? (
            <>Tell us about <span style={{ color: "#B6FF00" }}>your hosting</span></>
          ) : (
            <>Sign in <span style={{ color: "#B6FF00" }}>to apply</span></>
          )}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#9CA3AF", lineHeight: 1.6, marginBottom: "1.75rem" }}>
          {signedIn
            ? "A few quick questions so we can review your application. We usually get back to applicants within 2–3 working days."
            : "Sign in to link your application to your Fittrybe profile — then we'll show you the short application form."}
        </p>

        {checkingSession ? (
          <p style={{ color: "#6B7280", fontSize: "0.85rem", textAlign: "center" }}>
            Checking session…
          </p>
        ) : !signedIn ? (
          <>
            {/* OAuth */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => onOAuth("google")}
                disabled={oauthBusy !== null || signingIn}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                  width: "100%", background: "#fff", color: "#0D0D0D", border: "none",
                  borderRadius: 8, padding: "0.85rem 1rem", fontSize: "0.92rem", fontWeight: 600,
                  cursor: oauthBusy !== null || signingIn ? "not-allowed" : "pointer",
                  opacity: oauthBusy === "google" ? 0.7 : 1,
                }}
              >
                <GoogleIcon />
                {oauthBusy === "google" ? "Redirecting…" : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={() => onOAuth("apple")}
                disabled={oauthBusy !== null || signingIn}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                  width: "100%", background: "#000", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
                  padding: "0.85rem 1rem", fontSize: "0.92rem", fontWeight: 600,
                  cursor: oauthBusy !== null || signingIn ? "not-allowed" : "pointer",
                  opacity: oauthBusy === "apple" ? 0.7 : 1,
                }}
              >
                <AppleIcon />
                {oauthBusy === "apple" ? "Redirecting…" : "Continue with Apple"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0 1rem" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "0.7rem", color: "#4B5563", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                or with email
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label htmlFor="bah-email" className="bah-label">Email</label>
                <input
                  id="bah-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSignIn()}
                  className="bah-input"
                />
              </div>
              <div>
                <label htmlFor="bah-pass" className="bah-label">Password</label>
                <input
                  id="bah-pass"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSignIn()}
                  className="bah-input"
                />
              </div>

              {error && (
                <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center" }}>
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={onSignIn}
                disabled={signingIn || oauthBusy !== null}
                className="bah-cta"
              >
                {signingIn ? "Signing in…" : "Sign in to continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Signed-in badge */}
            <div
              style={{
                background: "rgba(182,255,0,0.06)",
                border: "1px solid rgba(182,255,0,0.18)",
                borderRadius: 8,
                padding: "0.9rem 1rem",
                marginBottom: "1.5rem",
                display: "flex", alignItems: "center", gap: "0.8rem",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#B6FF00", color: "#0D0D0D",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconCheck size={18} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "0.7rem", color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                  Applying as
                </p>
                <p style={{ fontSize: "0.92rem", color: "#fff", fontWeight: 600, wordBreak: "break-all" }}>
                  {user!.email}
                </p>
              </div>
            </div>

            {/* Application form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label htmlFor="bah-fullname" className="bah-label">Full name</label>
                <input
                  id="bah-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bah-input"
                  placeholder="e.g. Jordan Adebayo"
                />
              </div>

              <div>
                <label htmlFor="bah-city" className="bah-label">City / area</label>
                <input
                  id="bah-city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bah-input"
                  placeholder="e.g. London — Hackney"
                />
              </div>

              <div>
                <label htmlFor="bah-sport" className="bah-label">Primary sport you want to host</label>
                <input
                  id="bah-sport"
                  type="text"
                  value={primarySport}
                  onChange={(e) => setPrimarySport(e.target.value)}
                  className="bah-input"
                  placeholder="e.g. 5-a-side football"
                />
                <p className="bah-hint">You can host other sports too — just tell us the main one.</p>
              </div>

              <div>
                <label htmlFor="bah-experience" className="bah-label">Hosting experience (optional)</label>
                <textarea
                  id="bah-experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="bah-textarea"
                  placeholder="Run a weekly kickabout? Coach a team? Manage a WhatsApp group? Tell us briefly."
                  maxLength={500}
                />
              </div>

              <div>
                <label htmlFor="bah-motivation" className="bah-label">Why do you want to host on Fittrybe?</label>
                <textarea
                  id="bah-motivation"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="bah-textarea"
                  placeholder="What kind of trybe are you trying to build, and how often do you plan to run sessions?"
                  maxLength={800}
                  required
                />
              </div>

              <div>
                <label htmlFor="bah-social" className="bah-label">Instagram / social or website (optional)</label>
                <input
                  id="bah-social"
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="bah-input"
                  placeholder="https://instagram.com/yourhandle"
                />
                <p className="bah-hint">Helps us verify the community you already run.</p>
              </div>

              {error && (
                <p role="alert" style={{ fontSize: "0.82rem", color: "#ff6b6b", textAlign: "center" }}>
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="bah-cta"
              >
                {submitting ? "Submitting…" : (
                  <>
                    Submit application <IconArrowRight size={18} />
                  </>
                )}
              </button>

              <p
                style={{
                  fontSize: "0.74rem",
                  color: "#4B5563",
                  textAlign: "center",
                  display: "inline-flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                <IconLock size={12} />
                Your details are reviewed by the Fittrybe team only.
              </p>

              <button
                type="button"
                onClick={onSignOut}
                disabled={submitting}
                className="bah-ghost-btn"
              >
                Use a different account
              </button>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "#4B5563", textAlign: "center", lineHeight: 1.6 }}>
        By applying you agree to our{" "}
        <Link href="/terms" style={{ color: "#9CA3AF", textDecoration: "underline", textUnderlineOffset: 3 }}>Terms</Link> and{" "}
        <Link href="/privacy" style={{ color: "#9CA3AF", textDecoration: "underline", textUnderlineOffset: 3 }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}

/* ─── Step 3: Submitted ────────────────────────────────────────────────── */
function SubmittedStep({ userEmail }: { userEmail: string | null }) {
  return (
    <div className="bah-fade" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div
        aria-hidden="true"
        style={{
          width: 84, height: 84,
          borderRadius: "50%",
          background: "#B6FF00",
          color: "#0D0D0D",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.75rem",
          boxShadow: "0 0 0 12px rgba(182,255,0,0.08), 0 30px 80px rgba(182,255,0,0.18)",
        }}
      >
        <IconCheck size={36} />
      </div>

      <p
        style={{
          color: "#B6FF00",
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
        }}
      >
        Application Received
      </p>

      <h2
        className="bah-fade-1"
        style={{
          fontFamily: "var(--font-anton, 'Anton', sans-serif)",
          fontWeight: 900,
          fontSize: "clamp(2rem, 5.5vw, 3rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
        }}
      >
        Thanks — we&apos;ve <span style={{ color: "#B6FF00" }}>got it.</span>
      </h2>

      <p
        className="bah-fade-2"
        style={{
          fontSize: "1rem",
          color: "#9CA3AF",
          lineHeight: 1.7,
          marginBottom: "1.75rem",
        }}
      >
        Your host application is in. A real human from the Fittrybe team will read it
        and get back to you within 2–3 working days
        {userEmail ? <> at <span style={{ color: "#fff" }}>{userEmail}</span></> : null}.
        If approved, we&apos;ll send you an activation link to switch on your verified-host tools.
      </p>

      <div
        className="bah-fade-3"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "1.25rem 1.4rem",
          marginBottom: "2rem",
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#6B7280",
            marginBottom: "0.6rem",
          }}
        >
          What happens next
        </p>
        <ol style={{ paddingLeft: "1.1rem", color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 1.7 }}>
          <li>We review your application (usually 2–3 working days).</li>
          <li>If it&apos;s a fit, you&apos;ll get an email with an activation link.</li>
          <li>Activate, start running sessions, and build your trybe.</li>
        </ol>
      </div>

      <div
        className="bah-fade-3"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
        }}
      >
        <Link href="/" className="bah-cta" aria-label="Back to Fittrybe homepage" style={{ textDecoration: "none" }}>
          Back to home
        </Link>
        <Link
          href="/events"
          aria-label="Browse upcoming sessions"
          style={{
            background: "transparent",
            color: "#9CA3AF",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "0.85rem 1.4rem",
            fontSize: "0.88rem",
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Browse sessions
        </Link>
      </div>
    </div>
  );
}
