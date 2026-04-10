// app/admin/posts/page.tsx — Blog posts admin
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllPostsAdmin, deletePost, togglePublish } from "@/lib/posts";
import { onAuthChange } from "@/lib/auth";
import type { BlogPost } from "@/lib/posts";
import { PageHeader, AdminTable, Tr, Td, Badge, ActionButton } from "@/components/admin/AdminUI";

type AdminPost = BlogPost & { id: string };

export default function AdminPostsPage() {
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
    const unsub = onAuthChange((user) => {
      if (!user) { router.push("/admin/login"); return; }
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
          p.id === post.id ? { ...p, status: p.status === "published" ? "draft" : "published" } : p
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Blog Posts"
        action={
          <Link
            href="/admin/posts/new"
            className="px-5 py-2.5 bg-[#B6FF00] text-black font-bold rounded-xl hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-sm uppercase tracking-wide"
          >
            + New Post
          </Link>
        }
      />

      {loading ? (
        <div className="text-white/40 py-20 text-center font-[family-name:var(--font-dm-sans)]">Loading…</div>
      ) : (
        <AdminTable
          headers={["Title", "Slug", "Status", "Updated", ""]}
          isEmpty={posts.length === 0}
          empty="No posts yet."
        >
          {posts.map((post, i) => (
            <Tr key={post.id} last={i === posts.length - 1}>
              <Td>
                <p className="font-medium text-white line-clamp-1">{post.title}</p>
                <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{post.description}</p>
              </Td>
              <Td mono dim>{post.slug}</Td>
              <Td>
                <button
                  onClick={() => handleTogglePublish(post)}
                  disabled={actionLoading === post.id}
                  className="disabled:opacity-50"
                >
                  <Badge
                    label={actionLoading === post.id ? "…" : post.status === "published" ? "Published" : "Draft"}
                    color={post.status === "published" ? "green" : "gray"}
                  />
                </button>
              </Td>
              <Td dim>{new Date(post.updatedAt).toLocaleDateString("en-GB")}</Td>
              <Td>
                <div className="flex items-center gap-3 justify-end">
                  <ActionButton onClick={() => router.push(`/admin/posts/${post.slug}/edit`)} label="Edit" />
                  {post.status === "published" && (
                    <ActionButton onClick={() => window.open(`/blog/${post.slug}`, "_blank")} label="View ↗" variant="primary" />
                  )}
                  <ActionButton onClick={() => handleDelete(post.id, post.title)} label="Delete" variant="danger" />
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
