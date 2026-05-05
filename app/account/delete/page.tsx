/**
 * /account/delete — user-facing account deletion page
 *
 * Two-step flow:
 *   Step 1: Sign in (email + password) — proves the user owns the account.
 *   Step 2: Type DELETE and confirm.
 *
 * The actual cascade-delete + auth.users removal runs server-side in
 * /api/account/delete using the service role key.
 */

import type { Metadata } from "next";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Delete Account — Fittrybe",
  description:
    "Permanently delete your Fittrybe account and all associated data.",
  robots: { index: false, follow: false },
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}
