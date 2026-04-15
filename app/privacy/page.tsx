/**
 * ─── Fittrybe — Privacy Policy ───────────────────────────────────────────────
 * Static legal page, styled with prose-fittrybe.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import {
  buildWebPageSchema,
  buildGraphSchema,
  buildBreadcrumbSchema,
} from "@/lib/structured-data";

const PAGE_TITLE = "Privacy Policy";
const PAGE_DESCRIPTION =
  "How FitTrybe collects, uses, and protects your personal data. Read our full Privacy Policy in accordance with UK GDPR and the Data Protection Act 2018.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: buildCanonicalUrl("/privacy") },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/privacy"),
    siteName: seoConfig.siteName,
    locale: seoConfig.siteLocale,
    title: `${PAGE_TITLE} — ${seoConfig.siteName}`,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    site: seoConfig.twitterHandle,
    title: `${PAGE_TITLE} — ${seoConfig.siteName}`,
    description: PAGE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  const canonicalUrl = buildCanonicalUrl("/privacy");

  const pageJsonLd = buildGraphSchema([
    buildWebPageSchema({
      url: canonicalUrl,
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: PAGE_TITLE, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: PAGE_TITLE, url: canonicalUrl },
    ]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        {/* ─── Navbar ──────────────────────────────────────────────────────── */}
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link
            href="/"
            className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black tracking-tight text-[#B6FF00]"
          >
            FITTRYBE
          </Link>
          <Link
            href="/"
            className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-dm-sans)]"
          >
            ← Home
          </Link>
        </nav>

        {/* ─── Content ─────────────────────────────────────────────────────── */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-10">
            <h1 className="font-[family-name:var(--font-barlow-condensed)] text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-white/60 font-[family-name:var(--font-dm-sans)]">
              How FitTrybe collects, uses, and protects your personal data
            </p>
            <p className="text-sm text-white/40 mt-2 font-[family-name:var(--font-dm-sans)]">
              Effective Date: 14 April 2025 · Version 1.0
            </p>
          </header>

          <div className="prose-fittrybe">
            {/* 1. Introduction */}
            <h2>1. Introduction</h2>
            <p>
              FitTrybe Ltd (&ldquo;FitTrybe&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal data when you use the FitTrybe mobile application, website (fittrybe.co.uk), and related services (the &ldquo;Platform&rdquo;).
            </p>
            <p>
              This policy is written in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Please read it carefully. By using the Platform, you acknowledge that you have read and understood this policy.
            </p>

            {/* 2. Who We Are */}
            <h2>2. Who We Are (Data Controller)</h2>
            <p>
              FitTrybe Ltd is the data controller for personal data collected through the Platform. Our registered address is Redhill, Surrey, United Kingdom. If you have any questions or concerns about how we handle your data, please contact us at{" "}
              <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>.
            </p>

            {/* 3. Data We Collect */}
            <h2>3. Data We Collect</h2>

            <h3>3.1 Information You Provide Directly</h3>
            <ul>
              <li>Account registration data: name, email address, phone number, profile photo;</li>
              <li>Identity verification information (for Hosts using Stripe Connect): date of birth, bank account details, government-issued ID — collected and held by Stripe, not by FitTrybe;</li>
              <li>Session details created by Hosts: sport type, venue, time, pricing, description;</li>
              <li>Payment information: processed exclusively by Stripe — FitTrybe does not store full card numbers;</li>
              <li>Communications: messages sent via in-app chat, support emails;</li>
              <li>User-generated content: ratings, reviews, stories, and profile content.</li>
            </ul>

            <h3>3.2 Information Collected Automatically</h3>
            <ul>
              <li>Device information: device type, operating system, app version;</li>
              <li>Usage data: session interactions, features accessed, click patterns, crash reports;</li>
              <li>Location data: approximate location (used to surface nearby sessions) — we do not continuously track your location;</li>
              <li>Push notification tokens (via Firebase Cloud Messaging);</li>
              <li>IP address and log data.</li>
            </ul>

            <h3>3.3 Information from Third Parties</h3>
            <ul>
              <li>Stripe: payment transaction status, Connect account status;</li>
              <li>Supabase: authentication tokens and database events;</li>
              <li>Firebase: push notification delivery data.</li>
            </ul>

            {/* 4. How and Why We Use Your Data */}
            <h2>4. How and Why We Use Your Data</h2>
            <p>We process your personal data on the following legal bases under UK GDPR:</p>

            <h3>4.1 Performance of a Contract (Article 6(1)(b))</h3>
            <ul>
              <li>Creating and managing your account;</li>
              <li>Facilitating session bookings and payments;</li>
              <li>Processing refunds and cancellations;</li>
              <li>Enabling communications between Hosts and Players;</li>
              <li>Sending transactional push notifications (session reminders, booking confirmations).</li>
            </ul>

            <h3>4.2 Legitimate Interests (Article 6(1)(f))</h3>
            <ul>
              <li>Improving the Platform through usage analytics;</li>
              <li>Detecting and preventing fraud, abuse, and violations of our Terms;</li>
              <li>Sending non-marketing service updates and safety notices;</li>
              <li>Calculating Host reliability scores and session quality ratings;</li>
              <li>Maintaining platform security and integrity.</li>
            </ul>

            <h3>4.3 Consent (Article 6(1)(a))</h3>
            <ul>
              <li>Marketing communications (where you have opted in);</li>
              <li>Non-essential analytics or tracking (where applicable).</li>
            </ul>
            <p>
              You may withdraw consent at any time without affecting the lawfulness of processing before withdrawal.
            </p>

            <h3>4.4 Legal Obligation (Article 6(1)(c))</h3>
            <ul>
              <li>Complying with applicable laws, regulations, and lawful requests from authorities.</li>
            </ul>

            {/* 5. Sharing Your Data */}
            <h2>5. Sharing Your Data</h2>
            <p>We do not sell your personal data. We may share it with:</p>
            <ul>
              <li><strong>Stripe</strong> — for payment processing, Connect onboarding, and payout management. Stripe&rsquo;s privacy policy applies to data they hold: stripe.com/gb/privacy;</li>
              <li><strong>Supabase</strong> — our database and authentication infrastructure provider. Data is processed under Data Processing Agreements in accordance with UK GDPR;</li>
              <li><strong>Firebase (Google)</strong> — for push notification delivery via Firebase Cloud Messaging;</li>
              <li><strong>Other users</strong> — limited profile information (display name, photo) is visible to other users as necessary for the Platform to function;</li>
              <li><strong>Legal and regulatory authorities</strong> — where required by law or to protect the rights, safety, or property of FitTrybe or others;</li>
              <li><strong>Professional advisers</strong> — lawyers, accountants, and auditors acting under confidentiality obligations.</li>
            </ul>

            {/* 6. Data Retention */}
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the Platform&rsquo;s services, comply with legal obligations, resolve disputes, and enforce our agreements. Specifically:
            </p>
            <ul>
              <li>Account data: retained while your account is active and for up to 2 years after deletion;</li>
              <li>Transaction records: retained for 7 years in line with UK financial record-keeping requirements;</li>
              <li>Chat messages: retained for up to 12 months unless flagged for investigation;</li>
              <li>Device/analytics data: anonymised or deleted within 12 months.</li>
            </ul>
            <p>
              You may request deletion of your data at any time (subject to legal retention obligations). See Section 8 for how to exercise your rights.
            </p>

            {/* 7. International Transfers */}
            <h2>7. International Transfers</h2>
            <p>
              Our infrastructure providers (including Supabase and Firebase/Google) may process data in countries outside the UK. Where data is transferred outside the UK, we ensure it is protected by appropriate safeguards — such as the UK International Data Transfer Agreements (IDTAs) or equivalent adequacy measures — in accordance with UK GDPR Chapter V.
            </p>

            {/* 8. Your Rights */}
            <h2>8. Your Rights Under UK GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Right of access:</strong> to obtain a copy of the personal data we hold about you;</li>
              <li><strong>Right to rectification:</strong> to correct inaccurate or incomplete data;</li>
              <li><strong>Right to erasure:</strong> to request deletion of your data in certain circumstances;</li>
              <li><strong>Right to restrict processing:</strong> to limit how we use your data in certain circumstances;</li>
              <li><strong>Right to data portability:</strong> to receive your data in a structured, machine-readable format;</li>
              <li><strong>Right to object:</strong> to object to processing based on legitimate interests or for direct marketing;</li>
              <li><strong>Rights in relation to automated decision-making:</strong> not to be subject to solely automated decisions that significantly affect you.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>. We will respond within one calendar month. If you are unsatisfied with our response, you have the right to lodge a complaint with the Information Commissioner&rsquo;s Office (ICO) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>{" "}
              or by calling 0303 123 1113.
            </p>

            {/* 9. Security */}
            <h2>9. Security</h2>
            <p>
              We implement industry-standard technical and organisational security measures to protect your data against unauthorised access, disclosure, alteration, or destruction. These measures include encrypted data storage and transmission (TLS), row-level security on our database, access controls, and regular security reviews.
            </p>
            <p>
              While we take data security seriously, no system is completely secure. You should ensure your device and account credentials are kept safe. Please notify us immediately if you suspect any security breach involving your account.
            </p>

            {/* 10. Children's Privacy */}
            <h2>10. Children&rsquo;s Privacy</h2>
            <p>
              The Platform is intended for users aged 18 and over. We do not knowingly collect personal data from individuals under 18. If you believe we have inadvertently collected data from a minor, please contact us at{" "}
              <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>{" "}
              and we will delete it promptly.
            </p>

            {/* 11. Cookies */}
            <h2>11. Cookies and Tracking</h2>
            <p>
              The FitTrybe mobile app does not use browser cookies. Our website (fittrybe.co.uk) may use cookies and similar technologies for analytics and performance purposes. A separate Cookie Policy will be made available on the website. You can manage your cookie preferences through your browser settings.
            </p>

            {/* 12. Push Notifications */}
            <h2>12. Push Notifications</h2>
            <p>
              We use Firebase Cloud Messaging (FCM) to deliver push notifications to your device. Your device push token is stored securely and used solely for delivering Platform notifications. You can disable push notifications at any time through your device settings or within the FitTrybe app.
            </p>

            {/* 13. Links */}
            <h2>13. Links to Third-Party Sites</h2>
            <p>
              The Platform may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>

            {/* 14. Changes */}
            <h2>14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via in-app notification or email. The updated policy will display a revised effective date. Your continued use of the Platform after changes are made constitutes your acceptance of the updated policy.
            </p>

            {/* 15. Contact */}
            <h2>15. Contact Us</h2>
            <p>
              For any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>
              <br />
              <strong>Post:</strong> FitTrybe Ltd, Redhill, Surrey, United Kingdom
              <br />
              <strong>Website:</strong>{" "}
              <a href="https://fittrybe.co.uk">fittrybe.co.uk</a>
            </p>
            <p>
              For UK GDPR-related enquiries or to make a formal data subject request, please write to us at the above email address and mark your message &ldquo;Data Subject Request&rdquo;.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
