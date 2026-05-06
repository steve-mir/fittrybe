/**
 * /app/session/[id] — Legacy deep-link path; redirects to /session/[id].
 *
 * Kept as a stable alias so old shared links keep working. Permanent (308)
 * redirect consolidates link equity onto the canonical /session/[id] route.
 */

import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LegacySessionDeepLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/session/${encodeURIComponent(id)}`);
}
