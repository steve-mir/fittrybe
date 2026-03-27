// components/admin/PostEditor.tsx — Tiptap rich text editor
"use client";

import dynamic from "next/dynamic";

// Re-export the inner editor wrapped in dynamic so it is NEVER
// server-rendered (Tiptap uses browser-only APIs).
const PostEditorInner = dynamic(() => import("./PostEditorInner"), {
  ssr: false,
  loading: () => (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 min-h-[400px] flex items-center justify-center">
      <span className="text-white/30 text-sm font-[family-name:var(--font-dm-sans)]">
        Loading editor…
      </span>
    </div>
  ),
});

interface PostEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function PostEditor(props: PostEditorProps) {
  return <PostEditorInner {...props} />;
}
