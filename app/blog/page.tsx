// app/blog/page.tsx — Blog index: SEO hub listing all published posts
import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { buildCanonicalUrl } from "@/lib/seo-config";
import BlogCard from "@/components/BlogCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Sports Tips, Fitness Guides & Community Stories | Fittrybe",
  description:
    "Read the Fittrybe blog for tips on finding local sports sessions, fitness advice, community stories, and how to stay active in your city. Football, basketball, badminton, tennis and more.",
  alternates: {
    canonical: buildCanonicalUrl("/blog"),
  },
  openGraph: {
    type: "website",
    url: buildCanonicalUrl("/blog"),
    title: "Fittrybe Blog — Sports, Fitness & Community",
    description:
      "Tips on finding local sports sessions, fitness guides, and community stories from the Fittrybe team.",
  },
};

// Revalidate every 60 seconds so new posts appear without a full rebuild
export const revalidate = 60;

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black tracking-tight text-[#B6FF00]"
        >
          FITTRYBE
        </Link>
        <Link
          href="/waitlist"
          className="text-sm font-medium px-4 py-2 rounded-full bg-[#B6FF00] text-black hover:bg-[#B6FF00]/90 transition-colors"
        >
          Join Waitlist
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#B6FF00] mb-4">
          The Fittrybe Blog
        </span>
        <h1 className="font-[family-name:var(--font-barlow-condensed)] text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-4">
          Find Your Game.
          <br />
          <span className="text-[#B6FF00]">Stay in the Know.</span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto font-[family-name:var(--font-dm-sans)]">
          Sports tips, fitness guides, community stories, and everything you need
          to stay active in your city.
        </p>
      </section>

      {/* Post grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg font-[family-name:var(--font-dm-sans)]">
              No posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16 text-center">
        <p className="text-white/60 mb-4 font-[family-name:var(--font-dm-sans)]">
          Ready to find your tribe?
        </p>
        <Link
          href="/waitlist"
          className="inline-block px-8 py-4 bg-[#B6FF00] text-black font-bold rounded-full hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-lg uppercase tracking-wide"
        >
          Join the Waitlist
        </Link>
      </section>
    </main>
  );
}
