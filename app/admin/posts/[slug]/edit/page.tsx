// app/admin/posts/[slug]/edit/page.tsx — Edit an existing blog post
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PostForm from "@/components/admin/PostForm";
import { getPostBySlugAdmin, updatePost } from "@/lib/posts";
import type { PostInput, BlogPost } from "@/lib/posts";

type AdminPost = BlogPost & { id: string };

export default function EditPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPostBySlugAdmin(slug);
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSave(input: PostInput, id?: string): Promise<string> {
    if (!id) throw new Error("Post ID missing");
    await updatePost(id, input);
    return id;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B6FF00]/30 border-t-[#B6FF00] rounded-full animate-spin" />
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-white/60 font-[family-name:var(--font-dm-sans)]">Post not found.</p>
        <Link href="/admin" className="text-[#B6FF00] hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-white/40 hover:text-white transition-colors text-sm font-[family-name:var(--font-dm-sans)]"
            >
              ← Dashboard
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 text-sm font-[family-name:var(--font-dm-sans)]">
              Edit Post
            </span>
          </div>

          {post.status === "published" && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="text-sm text-white/40 hover:text-[#B6FF00] transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              View live ↗
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-black font-[family-name:var(--font-barlow-condensed)] uppercase mb-2">
          Edit Post
        </h1>
        <p className="text-white/40 text-sm mb-8 font-[family-name:var(--font-dm-sans)]">
          /blog/{post.slug} ·{" "}
          <span
            className={
              post.status === "published" ? "text-[#B6FF00]" : "text-white/40"
            }
          >
            {post.status}
          </span>
        </p>

        <PostForm initial={post} onSave={handleSave} />
      </div>
    </main>
  );
}
