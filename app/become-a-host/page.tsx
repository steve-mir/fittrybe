/**
 * /become-a-host — apply to be a verified Fittrybe host.
 *
 * Step 1: Benefits + Apply CTA.
 * Step 2: Sign-in (Google / Apple / email) → short application form
 *         (POST /api/become-a-host/apply).
 * Step 3: "Application received" confirmation.
 *
 * Server component → renders BecomeAHostClient. Marked noindex because this is
 * an application funnel reviewed by the team — we don't want it ranking for
 * generic queries and pulling in low-intent traffic.
 */

import type { Metadata } from "next";
import BecomeAHostClient from "./BecomeAHostClient";

export const metadata: Metadata = {
  title: "Apply to Host — Fittrybe",
  description:
    "Apply to host on Fittrybe. Tell us about the sport you want to run and the community you're building — we'll review your application and get back to you within a few days.",
  robots: { index: false, follow: false },
};

export default function BecomeAHostPage() {
  return <BecomeAHostClient />;
}
