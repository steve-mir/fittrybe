/**
 * ─── BlogPreviewSection ───────────────────────────────────────────────────────
 * Below-the-fold blog teaser. Loaded as a dynamic chunk so the Supabase
 * client + framer-motion stay out of the initial-paint bundle.
 */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: { seconds: number } | string | null;
  category?: string;
}

function IconArrowRight({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("blogs")
          .select("*")
          .order("publishedAt", { ascending: false })
          .limit(3);
        if (!cancelled && data) setPosts(data as BlogPost[]);
      } catch {
        // Handle error silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && posts.length === 0) return null;

  const formatDate = (raw: BlogPost["publishedAt"]) => {
    if (!raw) return "";
    const d =
      typeof raw === "string"
        ? new Date(raw)
        : new Date((raw as { seconds: number }).seconds * 1000);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <section
      aria-label="Latest from the Fittrybe blog"
      style={{
        padding: "100px 5vw",
        background: "#080808",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
        style={{
          marginBottom: "3rem",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#B6FF00",
              marginBottom: "0.6rem",
            }}
          >
            ● FROM THE BLOG
          </p>
          <h2
            style={{
              fontFamily: "var(--font-anton, 'Anton', sans-serif)",
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            LATEST <span style={{ color: "#B6FF00" }}>READS</span>
          </h2>
        </div>
        <Link
          href="/blog"
          className="blog-view-all"
          style={{
            color: "#9CA3AF",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-anton, 'Anton', sans-serif)",
            fontWeight: 700,
            fontSize: "0.85rem",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          View All Posts <IconArrowRight size={14} />
        </Link>
      </motion.div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 20,
                background: "#0D0D0D",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                height: 340,
              }}
            >
              <div
                style={{
                  height: 180,
                  background:
                    "linear-gradient(90deg, #111 25%, #181818 50%, #111 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
              <div style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    height: 12,
                    width: "40%",
                    background: "#181818",
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    height: 20,
                    width: "90%",
                    background: "#181818",
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{ height: 14, width: "70%", background: "#181818", borderRadius: 6 }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              className="bento-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              onClick={() => router.push(`/blog/${post.slug}`)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              aria-label={`Read blog post: ${post.title}`}
            >
              <div
                style={{
                  height: 190,
                  background: post.coverImage
                    ? "transparent"
                    : "linear-gradient(135deg, #0f1a00 0%, #0d0d0d 100%)",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "3rem", opacity: 0.15 }}>📝</span>
                  </div>
                )}
                {post.category && (
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      background: "rgba(182,255,0,0.12)",
                      border: "1px solid rgba(182,255,0,0.25)",
                      color: "#B6FF00",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 100,
                    }}
                  >
                    {post.category}
                  </span>
                )}
              </div>

              <div
                style={{
                  padding: "1.25rem 1.5rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                {post.publishedAt && (
                  <p
                    style={{
                      fontSize: "0.68rem",
                      color: "#4B5563",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {formatDate(post.publishedAt)}
                  </p>
                )}
                <h3
                  style={{
                    fontFamily: "var(--font-anton, 'Anton', sans-serif)",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    color: "#fff",
                    marginBottom: "0.6rem",
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#6B7280",
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: "1rem",
                    }}
                  >
                    {post.excerpt}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#B6FF00",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "auto",
                  }}
                >
                  Read More <IconArrowRight size={12} color="#B6FF00" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
