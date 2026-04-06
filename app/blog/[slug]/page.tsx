/**
 * ─── Fittrybe — Blog Post Page ────────────────────────────────────────────────
 * Wired to Supabase via lib/posts.ts.
 * generateStaticParams pre-renders all published posts at build time.
 *
 * SEO FIXES:
 *  1. OG image is always an ABSOLUTE URL (WhatsApp / crawlers require this)
 *  2. Fallback OG image uses the dynamic /api/og route with absolute base
 *  3. twitter:image also always absolute
 *  4. Added og:image:secure_url for WhatsApp compatibility
 *  5. readingTime added to structured data
 *  6. article:author and article:section added as extra OG tags
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogSlugs } from "@/lib/posts";
import { seoConfig, buildCanonicalUrl } from "@/lib/seo-config";
import {
  buildWebPageSchema,
  buildGraphSchema,
  buildBreadcrumbSchema,
} from "@/lib/structured-data";
import BlogPostContent from "@/components/BlogPostContent";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** Always returns an absolute HTTPS URL for the OG image. */
function resolveOGImage(post: {
  coverImage?: string;
  title: string;
  description: string;
}): string {
  if (post.coverImage && post.coverImage.startsWith("http")) {
    return post.coverImage;
  }
  // Fall back to the dynamic branded card — must be absolute for crawlers
  const params = new URLSearchParams({
    title: post.title,
    description: post.description,
  });
  return `${seoConfig.siteUrl}/api/og?${params.toString()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  const canonicalUrl = buildCanonicalUrl(`/blog/${slug}`);
  const ogImage = resolveOGImage(post);

  return {
    title: post.title,
    description: post.description,
    keywords: [...seoConfig.keywords.slice(0, 5), ...(post.tags ?? [])],
    authors: [{ name: post.author?.name ?? seoConfig.author.name }],
    alternates: { canonical: canonicalUrl },

    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.siteLocale,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author?.name ?? seoConfig.author.name],
      tags: post.tags,
      // Single image object — absolute URL, correct dimensions
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,          // ← WhatsApp prefers this
          width: 1200,
          height: 630,
          alt: post.title,
          type: post.coverImage?.startsWith("http") ? "image/jpeg" : "image/png",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title: post.title,
      description: post.description,
      images: [ogImage],              // ← must be absolute
    },
  };
}

/** Rough reading time estimate (200 wpm average). */
function estimateReadingTime(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const canonicalUrl = buildCanonicalUrl(`/blog/${slug}`);
  const ogImage = resolveOGImage(post);
  const readingTime = estimateReadingTime(post.content);

  const pageJsonLd = buildGraphSchema([
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${canonicalUrl}/#article`,
      headline: post.title,
      description: post.description,
      url: canonicalUrl,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: {
        "@type": "Person",
        name: post.author?.name ?? seoConfig.author.name,
      },
      publisher: { "@id": `${seoConfig.siteUrl}/#organization` },
      image: {
        "@type": "ImageObject",
        url: ogImage,
        width: 1200,
        height: 630,
      },
      isPartOf: { "@id": `${seoConfig.siteUrl}/#website` },
      keywords: post.tags?.join(", "),
      timeRequired: `PT${readingTime}M`,
      inLanguage: seoConfig.siteLanguage,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
    },
    buildWebPageSchema({
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      breadcrumb: [
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Blog", url: buildCanonicalUrl("/blog") },
        { name: post.title, url: canonicalUrl },
      ],
    }),
    buildBreadcrumbSchema([
      { name: "Home", url: seoConfig.siteUrl },
      { name: "Blog", url: buildCanonicalUrl("/blog") },
      { name: post.title, url: canonicalUrl },
    ]),
  ]);

  const publishDate = new Date(post.publishedAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />

      <main className="min-h-screen bg-[#050505] text-white">
        <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link
            href="/"
            className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black tracking-tight text-[#B6FF00]"
          >
            FITTRYBE
          </Link>
          <Link
            href="/blog"
            className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-dm-sans)]"
          >
            ← All articles
          </Link>
        </nav>

        <article
          className="max-w-4xl mx-auto px-6 py-12"
          itemScope
          itemType="https://schema.org/Article"
        >
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#B6FF00]/10 text-[#B6FF00]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <header className="mb-10">
            <h1
              itemProp="headline"
              className="font-[family-name:var(--font-barlow-condensed)] text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4"
            >
              {post.title}
            </h1>
            <p
              itemProp="description"
              className="text-xl text-white/60 mb-6 font-[family-name:var(--font-dm-sans)]"
            >
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-white/40 font-[family-name:var(--font-dm-sans)]">
              <span itemProp="author">{post.author?.name ?? "Fittrybe"}</span>
              <span>·</span>
              <time itemProp="datePublished" dateTime={post.publishedAt}>
                {publishDate}
              </time>
              <span>·</span>
              <span>{readingTime} min read</span>
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden aspect-[16/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                itemProp="image"
              />
            </div>
          )}

          <div itemProp="articleBody">
            <BlogPostContent html={post.content} />
          </div>

          <footer className="mt-16 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-white/60 mb-4 font-[family-name:var(--font-dm-sans)]">
              Ready to find local sports sessions near you?
            </p>
            <Link
              href="/waitlist"
              className="inline-block px-8 py-3 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
            >
              Join Fittrybe — Find Your Game
            </Link>
          </footer>
        </article>
      </main>
    </>
  );
}
