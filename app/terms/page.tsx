/**
 * ─── Fittrybe — Terms of Use ─────────────────────────────────────────────────
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

const PAGE_TITLE = "Terms of Use";
const PAGE_DESCRIPTION =
  "Your agreement with FitTrybe when using the app and services. Read the full Terms of Use for the FitTrybe Platform.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: buildCanonicalUrl("/terms") },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/terms"),
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

export default function TermsOfUsePage() {
  const canonicalUrl = buildCanonicalUrl("/terms");

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
              Terms of Use
            </h1>
            <p className="text-lg text-white/60 font-[family-name:var(--font-dm-sans)]">
              Your agreement with FitTrybe when using the app and services
            </p>
            <p className="text-sm text-white/40 mt-2 font-[family-name:var(--font-dm-sans)]">
              Effective Date: 14 April 2025 · Version 1.0
            </p>
          </header>

          <div className="prose-fittrybe">
            {/* 1. Introduction */}
            <h2>1. Introduction</h2>
            <p>
              Welcome to FitTrybe. These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the FitTrybe mobile application, website (fittrybe.co.uk), and all related services (collectively, the &ldquo;Platform&rdquo;) operated by FitTrybe Ltd (&ldquo;FitTrybe&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a company incorporated in England and Wales.
            </p>
            <p>
              By registering for an account or using the Platform in any way, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the Platform.
            </p>

            {/* 2. About FitTrybe */}
            <h2>2. About FitTrybe</h2>
            <p>
              FitTrybe is a hyperlocal grassroots sports session booking and community platform. It enables session hosts (&ldquo;Hosts&rdquo;) to create and manage sports sessions, and enables players (&ldquo;Players&rdquo;) to discover, book, and attend those sessions. FitTrybe also provides in-app chat, ratings, notifications, stories, and community features to support the grassroots sports community across the United Kingdom.
            </p>

            {/* 3. Eligibility */}
            <h2>3. Eligibility</h2>
            <p>You may use the Platform only if you:</p>
            <ul>
              <li>Are at least 18 years of age;</li>
              <li>Are a resident of the United Kingdom or are otherwise subject to UK law;</li>
              <li>Have the legal capacity to enter into a binding agreement;</li>
              <li>Are not prohibited from using the Platform under any applicable law.</li>
            </ul>
            <p>
              By creating an account, you represent and warrant that you meet all of the above eligibility requirements.
            </p>

            {/* 4. Account Registration */}
            <h2>4. Account Registration</h2>
            <p>
              To access most features of the Platform, you must register for an account. When doing so, you agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information;</li>
              <li>Keep your login credentials confidential and not share them with anyone;</li>
              <li>
                Notify us immediately at{" "}
                <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>{" "}
                if you suspect any unauthorised use of your account;
              </li>
              <li>Be responsible for all activity that occurs under your account.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your account if we have reasonable grounds to believe that information provided is inaccurate, fraudulent, or in breach of these Terms.
            </p>

            {/* 5. User Roles */}
            <h2>5. User Roles</h2>

            <h3>5.1 Players</h3>
            <p>
              A Player is a registered user who browses and books sports sessions on the Platform. Players may also rate Hosts and sessions, use in-app chat, and engage with community content.
            </p>

            <h3>5.2 Hosts</h3>
            <p>
              A Host is a registered user who creates and manages sports sessions for Players to join. Hosts may access a Host Dashboard, set session pricing, and receive payouts via Stripe Connect. Hosts may optionally subscribe to a FitTrybe Pro plan for enhanced features.
            </p>
            <p>
              Hosts are responsible for the accuracy of all session information they publish, including venue, date, time, sport, number of spaces, and pricing. FitTrybe does not independently verify venue bookings or session details provided by Hosts.
            </p>

            {/* 6. Session Booking and Payments */}
            <h2>6. Session Booking and Payments</h2>

            <h3>6.1 Booking</h3>
            <p>
              Players may book sessions through the Platform. Booking constitutes a direct agreement between the Player and the Host. FitTrybe acts as a technology intermediary and facilitator, not a party to that agreement.
            </p>

            <h3>6.2 Deposits and Session Fees</h3>
            <p>
              Some sessions may require a deposit or full payment at the point of booking. All payments are processed securely through Stripe, a third-party payment processor. FitTrybe does not store your full payment card details.
            </p>

            <h3>6.3 Refunds and Cancellations</h3>
            <p>
              Refund eligibility depends on the Host&rsquo;s cancellation policy as stated on the session listing, subject to the following minimum protections:
            </p>
            <ul>
              <li>If a Host cancels a session before it takes place, Players will receive a full refund of any amounts paid.</li>
              <li>If a Player cancels within the cancellation window specified on the session listing, they may be eligible for a partial or full refund.</li>
              <li>FitTrybe reserves the right to facilitate refunds in cases of dispute, error, or fraud at its sole discretion.</li>
            </ul>

            <h3>6.4 Host Payouts</h3>
            <p>
              Host earnings are processed through Stripe Connect. Hosts must complete Stripe&rsquo;s identity verification and onboarding before receiving payouts. FitTrybe&rsquo;s platform fee is deducted from session revenue before payouts are transferred. Hosts are responsible for their own tax obligations arising from income received through the Platform.
            </p>

            {/* 7. Host Obligations */}
            <h2>7. Host Obligations</h2>
            <p>
              By creating and publishing sessions on FitTrybe, you as a Host agree to:
            </p>
            <ul>
              <li>Only create sessions for venues you have lawful permission to use;</li>
              <li>Provide accurate, up-to-date session details at all times;</li>
              <li>Take reasonable steps to ensure sessions take place as advertised;</li>
              <li>Notify Players as early as possible if a session must be cancelled or changed;</li>
              <li>Hold any relevant qualifications, licences, or insurance required by law or by the venue;</li>
              <li>Comply with all applicable health and safety obligations;</li>
              <li>Treat all Players with dignity and respect;</li>
              <li>Not discriminate against Players on the basis of any protected characteristic under the Equality Act 2010.</li>
            </ul>

            {/* 8. Player Obligations */}
            <h2>8. Player Obligations</h2>
            <p>As a Player using FitTrybe, you agree to:</p>
            <ul>
              <li>Attend sessions you have booked, or cancel within the stated cancellation window;</li>
              <li>Behave respectfully toward Hosts, other Players, and venue staff;</li>
              <li>Only attend sessions appropriate to your physical fitness and health;</li>
              <li>Comply with all rules set by the Host and the venue;</li>
              <li>Not misuse the no-show or refund system;</li>
              <li>Not use the Platform to harass, intimidate, or abuse any other user.</li>
            </ul>

            {/* 9. Ratings and Reviews */}
            <h2>9. Ratings and Reviews</h2>
            <p>
              Players may rate and review Hosts and sessions after attending. Hosts may receive reliability and quality scores based on aggregated user feedback. You agree that any rating or review you submit:
            </p>
            <ul>
              <li>Is honest, accurate, and based on your genuine experience;</li>
              <li>Does not contain defamatory, offensive, or misleading content;</li>
              <li>Does not violate any third party&rsquo;s rights.</li>
            </ul>
            <p>
              FitTrybe reserves the right to remove any review that violates these Terms or our Community Guidelines, but is under no obligation to do so.
            </p>

            {/* 10. In-App Communications */}
            <h2>10. In-App Communications</h2>
            <p>
              The Platform provides in-app chat and community features (including stories and session feeds). You are solely responsible for any content you submit. You agree not to use these features to:
            </p>
            <ul>
              <li>Share spam, unsolicited promotions, or off-platform contact details in a manner designed to circumvent the Platform;</li>
              <li>Distribute harmful, offensive, or illegal content;</li>
              <li>Impersonate any person or entity;</li>
              <li>Coordinate activity designed to defraud FitTrybe, Hosts, or Players.</li>
            </ul>
            <p>
              FitTrybe may monitor communications to enforce these Terms and its Community Guidelines, and may remove content or suspend accounts at its discretion.
            </p>

            {/* 11. Push Notifications */}
            <h2>11. Push Notifications</h2>
            <p>
              By using the Platform, you consent to receive push notifications related to your account activity, session updates, and community features. You may manage your notification preferences within the app settings at any time.
            </p>

            {/* 12. Intellectual Property */}
            <h2>12. Intellectual Property</h2>
            <p>
              All content, trademarks, logos, designs, software, and other materials on the Platform are the property of FitTrybe Ltd or its licensors and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable licence to use the Platform for its intended purpose only.
            </p>
            <p>
              You retain ownership of any content you submit to the Platform (such as profile photos or session images), but you grant FitTrybe a worldwide, royalty-free licence to use, display, and distribute such content for the purpose of operating and promoting the Platform.
            </p>

            {/* 13. Prohibited Conduct */}
            <h2>13. Prohibited Conduct</h2>
            <p>You must not:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose or in violation of any regulations;</li>
              <li>Attempt to reverse-engineer, decompile, or exploit the Platform&rsquo;s software;</li>
              <li>Introduce viruses, malware, or any other harmful code;</li>
              <li>Scrape, crawl, or otherwise extract data from the Platform without authorisation;</li>
              <li>Create fake accounts or misrepresent your identity;</li>
              <li>Facilitate transactions outside the Platform to avoid platform fees;</li>
              <li>Use the Platform to engage in any discriminatory, abusive, or harassing behaviour.</li>
            </ul>

            {/* 14. Disclaimers */}
            <h2>14. Disclaimers</h2>
            <p>
              The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, FitTrybe makes no warranties, express or implied, regarding the reliability, accuracy, fitness for purpose, or availability of the Platform.
            </p>
            <p>
              FitTrybe does not endorse, verify, or take responsibility for the conduct of Hosts or Players, the safety of venues, or the quality of sessions. Participation in any session is entirely at your own risk.
            </p>

            {/* 15. Limitation of Liability */}
            <h2>15. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, FitTrybe Ltd and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, personal injury, or property damage arising out of or relating to your use of the Platform.
            </p>
            <p>
              Nothing in these Terms limits our liability for death or personal injury caused by our negligence, fraud, or fraudulent misrepresentation, or any other liability that cannot be excluded by law.
            </p>
            <p>
              Our total aggregate liability to you for any claim arising out of or in connection with these Terms shall not exceed the greater of (a) £100 or (b) the total fees paid by you to FitTrybe in the twelve months preceding the claim.
            </p>

            {/* 16. Indemnification */}
            <h2>16. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless FitTrybe and its affiliates, officers, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your breach of these Terms; (c) any content you submit; or (d) your violation of any third-party rights.
            </p>

            {/* 17. Third-Party Services */}
            <h2>17. Third-Party Services</h2>
            <p>
              The Platform integrates with third-party services including Stripe (payment processing), Supabase (data infrastructure), and Firebase Cloud Messaging (push notifications). Your use of these services is subject to their respective terms and privacy policies. FitTrybe is not responsible for the practices or content of third-party services.
            </p>

            {/* 18. Termination */}
            <h2>18. Termination</h2>
            <p>
              You may delete your account at any time through the app settings. FitTrybe reserves the right to suspend or terminate your access to the Platform at any time, with or without notice, if we reasonably believe you have violated these Terms, posed a risk to other users, or for any other legitimate business reason.
            </p>
            <p>
              Upon termination, your right to use the Platform ceases immediately. Any outstanding payment obligations survive termination.
            </p>

            {/* 19. Changes */}
            <h2>19. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes via in-app notification or email. Your continued use of the Platform after the effective date of updated Terms constitutes your acceptance of those changes. If you do not agree with the updated Terms, you must stop using the Platform.
            </p>

            {/* 20. Governing Law */}
            <h2>20. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of England and Wales. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
            <p>
              We encourage you to contact us first to attempt to resolve any dispute informally before initiating legal proceedings.
            </p>

            {/* 21. Contact */}
            <h2>21. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@fittrybe.co.uk">legal@fittrybe.co.uk</a>
              <br />
              <strong>Address:</strong> FitTrybe Ltd, Redhill, Surrey, United Kingdom
              <br />
              <strong>Website:</strong>{" "}
              <a href="https://fittrybe.co.uk">fittrybe.co.uk</a>
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
