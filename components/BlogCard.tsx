// components/BlogCard.tsx
import Link from "next/link";
import type { BlogPost } from "@/lib/posts";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const date = new Date(post.publishedAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#B6FF00]/40 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover image */}
      {post.coverImage ? (
        <div className="aspect-[16/9] overflow-hidden bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-[#B6FF00]/10 to-white/5 flex items-center justify-center">
          <span className="text-4xl">⚽</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#B6FF00]/10 text-[#B6FF00] uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-bold text-white mb-2 group-hover:text-[#B6FF00] transition-colors line-clamp-2 font-[family-name:var(--font-barlow-condensed)]">
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-white/60 line-clamp-3 mb-4 font-[family-name:var(--font-dm-sans)]">
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-white/40 font-[family-name:var(--font-dm-sans)]">
          <span>{post.author?.name ?? "Fittrybe"}</span>
          <time dateTime={post.publishedAt}>{date}</time>
        </div>
      </div>
    </Link>
  );
}
