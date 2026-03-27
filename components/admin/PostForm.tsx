// components/admin/PostForm.tsx — Shared form for creating / editing posts
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ImageUpload from "./ImageUpload";
import type { PostInput, BlogPost } from "@/lib/posts";

// Tiptap uses browser APIs — load client-side only
const PostEditor = dynamic(() => import("./PostEditor"), { ssr: false });

interface PostFormProps {
  /** Existing post data when editing; undefined when creating */
  initial?: BlogPost & { id: string };
  onSave: (input: PostInput, id?: string) => Promise<string>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PostForm({ initial, onSave }: PostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [authorName, setAuthorName] = useState(initial?.author?.name ?? "Fittrybe");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initial);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from title (unless user manually edited it)
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManuallyEdited) setSlug(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlug(slugify(val));
    setSlugManuallyEdited(true);
  }

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  async function submit(status: "draft" | "published") {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!slug.trim()) { setError("Slug is required."); return; }
    if (!description.trim()) { setError("Meta description is required."); return; }
    if (!content || content === "<p></p>") { setError("Content cannot be empty."); return; }

    setError("");
    setSaving(true);

    const input: PostInput = {
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      content,
      coverImage,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author: { name: authorName.trim() || "Fittrybe" },
      status,
    };

    try {
      await onSave(input, initial?.id);
      router.push("/admin");
      router.refresh();
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldLabel = "block text-sm text-white/60 mb-1.5 font-[family-name:var(--font-dm-sans)]";
  const fieldInput =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-[#B6FF00]/50 transition-colors font-[family-name:var(--font-dm-sans)] text-sm";

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-[family-name:var(--font-dm-sans)]">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className={fieldLabel}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="How to Find Football Sessions Near You"
          className={fieldInput}
        />
      </div>

      {/* Slug */}
      <div>
        <label className={fieldLabel}>Slug *</label>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-sm font-[family-name:var(--font-dm-sans)]">/blog/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="how-to-find-football-near-you"
            className={`${fieldInput} flex-1 font-mono`}
          />
        </div>
      </div>

      {/* Meta description */}
      <div>
        <label className={fieldLabel}>
          Meta Description * <span className="text-white/30">({description.length}/160)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={160}
          rows={2}
          placeholder="A short description that appears in search results and social previews."
          className={`${fieldInput} resize-none`}
        />
      </div>

      {/* Author */}
      <div>
        <label className={fieldLabel}>Author Name</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Fittrybe"
          className={fieldInput}
        />
      </div>

      {/* Tags */}
      <div>
        <label className={fieldLabel}>Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="football, sports tips, fitness"
          className={fieldInput}
        />
      </div>

      {/* Cover image */}
      <ImageUpload value={coverImage} onChange={setCoverImage} />

      {/* Content editor */}
      <div>
        <label className={fieldLabel}>Content *</label>
        <PostEditor content={content} onChange={handleContentChange} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => submit("draft")}
          disabled={saving}
          className="px-6 py-3 border border-white/10 text-white/60 hover:text-white hover:border-white/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wide"
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={() => submit("published")}
          disabled={saving}
          className="px-6 py-3 bg-[#B6FF00] text-black font-bold rounded-xl text-sm hover:bg-[#B6FF00]/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wide"
        >
          {saving ? "Publishing…" : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          disabled={saving}
          className="ml-auto text-sm text-white/40 hover:text-white/60 transition-colors font-[family-name:var(--font-dm-sans)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
