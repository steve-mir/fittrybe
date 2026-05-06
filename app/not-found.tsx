/**
 * ─── Fittrybe — Global 404 Page ───────────────────────────────────────────────
 * Rendered for any unmatched route. Uses the official brand wordmark asset.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = {
  title: "Page Not Found | Fittrybe",
  description: "The page you're looking for doesn't exist. Head back to the home page or join the Fittrybe waitlist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-16 font-[family-name:var(--font-inter-tight)]">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          aria-label="Fittrybe — return to homepage"
          className="inline-flex items-center gap-2.5 mb-10"
        >
          <Image
            src="/logo-icon-lime.png"
            alt=""
            width={36}
            height={36}
            priority
          />
          <Wordmark height={32} />
        </Link>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B6FF3B] mb-3">
          Error 404
        </p>
        <h1 className="font-[family-name:var(--font-anton)] text-5xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4 leading-none">
          Off the pitch.
        </h1>
        <p className="text-white/60 text-base sm:text-lg max-w-sm mx-auto mb-10">
          The page you&rsquo;re looking for has been subbed off — or never made the team sheet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#B6FF3B] text-black font-bold uppercase tracking-wide font-[family-name:var(--font-anton)] text-sm hover:bg-[#B6FF3B]/90 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/waitlist"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/15 text-white/80 font-bold uppercase tracking-wide font-[family-name:var(--font-anton)] text-sm hover:bg-white/5 hover:text-white transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </main>
  );
}
