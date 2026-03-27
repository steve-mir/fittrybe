// app/admin/posts/new/page.tsx — Create a new blog post
"use client";

import Link from "next/link";
import PostForm from "@/components/admin/PostForm";
import { createPost } from "@/lib/posts";
import type { PostInput } from "@/lib/posts";

export default function NewPostPage() {
  async function handleSave(input: PostInput): Promise<string> {
    return await createPost(input);
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
              New Post
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-black font-[family-name:var(--font-barlow-condensed)] uppercase mb-8">
          New Post
        </h1>
        <PostForm onSave={handleSave} />
      </div>
    </main>
  );
}
