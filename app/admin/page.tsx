// app/admin/page.tsx — Admin dashboard: all posts table
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllPostsAdmin, deletePost, togglePublish } from "@/lib/posts";
import { signOut, onAuthChange } from "@/lib/auth";
import type { BlogPost } from "@/lib/posts";

type AdminPost = BlogPost & { id: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getAllPostsAdmin();
      setPosts(data);
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verify auth on mount
    const unsub = onAuthChange((user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      fetchPosts();
    });
    return unsub;
  }, [router, fetchPosts]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete post.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTogglePublish(post: AdminPost) {
    setActionLoading(post.id);
    try {
      await togglePublish(post.id, post.status);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                status: p.status === "published" ? "draft" : "published",
              }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSignOut() {
    await signOut();
    document.cookie = "fittrybe_admin_session=; path=/; max-age=0";
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-black text-[#B6FF00]">
              FITTRYBE
            </span>
            <span className="text-white/40 text-sm font-[family-name:var(--font-dm-sans)]">
              / Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="text-sm text-white/60 hover:text-white transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              View blog ↗
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm px-4 py-2 border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black font-[family-name:var(--font-barlow-condensed)] uppercase">
            Blog Posts
          </h1>
          <Link
            href="/admin/posts/new"
            className="px-5 py-2.5 bg-[#B6FF00] text-black font-bold rounded-xl hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-sm uppercase tracking-wide"
          >
            + New Post
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-white/40 py-20 text-center font-[family-name:var(--font-dm-sans)]">
            Loading posts…
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40 mb-4 font-[family-name:var(--font-dm-sans)]">
              No posts yet.
            </p>
            <Link
              href="/admin/posts/new"
              className="text-[#B6FF00] hover:underline text-sm font-[family-name:var(--font-dm-sans)]"
            >
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm font-[family-name:var(--font-dm-sans)]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-white/60 font-medium">Title</th>
                  <th className="text-left px-4 py-4 text-white/60 font-medium hidden md:table-cell">
                    Slug
                  </th>
                  <th className="text-left px-4 py-4 text-white/60 font-medium">Status</th>
                  <th className="text-left px-4 py-4 text-white/60 font-medium hidden lg:table-cell">
                    Updated
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => (
                  <tr
                    key={post.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      i === posts.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white line-clamp-1">{post.title}</p>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{post.description}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-white/50 font-mono text-xs">
                      {post.slug}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        disabled={actionLoading === post.id}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                          post.status === "published"
                            ? "bg-[#B6FF00]/10 text-[#B6FF00] hover:bg-[#B6FF00]/20"
                            : "bg-white/10 text-white/50 hover:bg-white/20"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === post.id
                          ? "…"
                          : post.status === "published"
                          ? "Published"
                          : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-white/40 text-xs">
                      {new Date(post.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          href={`/admin/posts/${post.slug}/edit`}
                          className="text-white/60 hover:text-white transition-colors text-xs"
                        >
                          Edit
                        </Link>
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-white/60 hover:text-[#B6FF00] transition-colors text-xs"
                          >
                            View ↗
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={actionLoading === post.id}
                          className="text-red-400/60 hover:text-red-400 transition-colors text-xs disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
