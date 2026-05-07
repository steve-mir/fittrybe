/**
 * /become-a-host — apply to be a verified Fittrybe host.
 *
 * Step 1: Benefits + Continue CTA.
 * Step 2: Sign-in (Google / Apple / email) → Stripe Checkout subscription.
 *
 * Server component → renders BecomeAHostClient. Marked noindex because this is
 * a transactional page tied to a paid subscription; we don't want it ranking
 * for generic queries and pulling in tyre-kickers.
 */

import type { Metadata } from "next";
import BecomeAHostClient from "./BecomeAHostClient";

export const metadata: Metadata = {
  title: "Become a Host — Fittrybe",
  description:
    "Apply to be a verified Fittrybe host. Run sessions, get paid, and build your trybe — £9.99/month, cancel anytime.",
  robots: { index: false, follow: false },
};

export default function BecomeAHostPage() {
  return <BecomeAHostClient />;
}
