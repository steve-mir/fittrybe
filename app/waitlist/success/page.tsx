import type { Metadata } from "next";
import { Suspense } from "react";
import WaitlistSuccessClient from "@/components/WaitlistSuccessClient";

export const metadata: Metadata = {
  title: "You're In! | Fittrybe",
  description: "You've joined the Fittrybe waitlist. We'll be in touch when we launch in your city.",
  robots: { index: false, follow: false },
};

export default function WaitlistSuccessPage() {
  return (
    <Suspense fallback={null}>
      <WaitlistSuccessClient />
    </Suspense>
  );
}