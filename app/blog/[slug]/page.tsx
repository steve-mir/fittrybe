/**
 * ─── Fittrybe — Blog Post Page (Programmatic SEO Foundation) ─────────────────
 *
 * Architecture for future programmatic SEO pages.
 * When you create blog content, this page auto-generates:
 *  • Unique title + meta description per post
 *  • Canonical URL per post
 *  • Article JSON-LD schema
 *  • Dynamic OG image per post
 *  • Sitemap entry (via sitemap.ts)
 *
 * To activate:
 *  1. Create a data source (CMS, markdown files, database)
 *  2. Implement getBlogPost() and getAllBlogSlugs() below
 *  3. Update /app/sitemap.ts to include blog slugs
 *  4. Remove the notFound() call
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seoConfig, buildOGImageUrl, buildCanonicalUrl } from "@/lib/seo-config";
import { buildWebPageSchema, buildGraphSchema, buildBreadcrumbSchema } from "@/lib/structured-data";

// ─── Type definitions ─────────────────────────────────────────────────────────
interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  updatedAt?: string;
  author?: { name: string; url?: string };
  tags?: string[];
  image?: string;
}

// ─── Data fetching stubs ──────────────────────────────────────────────────────
// Replace these with your actual data source when ready.

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // TODO: fetch from your CMS / filesystem / database
  // Example with markdown files:
  //   const fs = require('fs');
  //   const matter = require('gray-matter');
  //   const file = fs.readFileSync(`content/blog/${slug}.md`, 'utf8');
  //   const { data, content } = matter(file);
  //   return { slug, content, ...data };
  //
  // Example with Contentful:
  //   const entry = await contentful.getEntries({ 'fields.slug': slug, content_type: 'blogPost' });
  //   return entry.items[0] ? mapEntry(entry.items[0]) : null;

  void slug; // suppress unused warning
  return null; // remove this when implementing
}

async function getAllBlogSlugs(): Promise<string[]> {
  // TODO: return all slugs for static generation
  return [];
}

// ─── Static params (tells Next.js which slugs to pre-render) ─────────────────
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ─── Dynamic metadata per post ────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  const canonicalUrl = buildCanonicalUrl(`/blog/${slug}`);

  return {
    title: post.title,
    description: post.description,
    keywords: [...(seoConfig.keywords.slice(0, 5)), ...(post.tags ?? [])],
    authors: post.author
      ? [{ name: post.author.name, url: post.author.url }]
      : [{ name: seoConfig.author.name }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: post.author ? [post.author.url ?? seoConfig.siteUrl] : [seoConfig.siteUrl],
      tags: post.tags,
      images: [
        {
          url: buildOGImageUrl({ title: post.title, description: post.description }),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [buildOGImageUrl({ title: post.title })],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Return 404 until real data is wired up
  if (!post) notFound();

  const canonicalUrl = buildCanonicalUrl(`/blog/${slug}`);

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
      author: post.author
        ? { "@type": "Person", name: post.author.name, url: post.author.url }
        : { "@id": `${seoConfig.siteUrl}/#organization` },
      publisher: { "@id": `${seoConfig.siteUrl}/#organization` },
      image: buildOGImageUrl({ title: post.title }),
      isPartOf: { "@id": `${seoConfig.siteUrl}/#website` },
      keywords: post.tags?.join(", "),
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: pageJsonLd }}
      />
      <main>
        <article itemScope itemType="https://schema.org/Article">
          {/* Semantic HTML structure optimised for AI crawlers */}
          <header>
            <h1 itemProp="headline">{post.title}</h1>
            <p itemProp="description">{post.description}</p>
            <time itemProp="datePublished" dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </time>
          </header>

          <div itemProp="articleBody">
            {/* Render your markdown/rich text content here */}
            {post.content}
          </div>

          {/* Internal link back to home (keyword-rich anchor) */}
          <footer>
            <a href="/waitlist">
              Find local sports sessions near you — join Fittrybe
            </a>
          </footer>
        </article>
      </main>
    </>
  );
}
