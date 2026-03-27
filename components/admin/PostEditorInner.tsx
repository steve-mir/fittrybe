// components/admin/PostEditorInner.tsx — Tiptap editor implementation
// This file is loaded ONLY on the client (via dynamic import in PostEditor.tsx).
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { uploadImage } from "@/lib/uploadImage";
import { useRef } from "react";

interface PostEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function PostEditorInner({ content, onChange }: PostEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-fittrybe min-h-[400px] focus:outline-none px-6 py-4 text-white",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      alert("Image upload failed.");
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function addLink() {
    const url = prompt("Enter URL:");
    if (!url) return;
    editor!.chain().focus().setLink({ href: url }).run();
  }

  const btnBase =
    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors font-[family-name:var(--font-dm-sans)]";
  const btnActive = "bg-[#B6FF00] text-black";
  const btnInactive = "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white";

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
        {/* Headings */}
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={`${btnBase} ${
              editor.isActive("heading", { level }) ? btnActive : btnInactive
            }`}
          >
            H{level}
          </button>
        ))}

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Inline marks */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnInactive}`}>
          B
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} italic ${editor.isActive("italic") ? btnActive : btnInactive}`}>
          I
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${btnBase} font-mono ${editor.isActive("code") ? btnActive : btnInactive}`}>
          {"<>"}
        </button>

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : btnInactive}`}>
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : btnInactive}`}>
          1. List
        </button>

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Blockquote + HR */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : btnInactive}`}>
          Quote
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`${btnBase} ${btnInactive}`}>
          ─
        </button>

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Link */}
        <button type="button" onClick={addLink}
          className={`${btnBase} ${editor.isActive("link") ? btnActive : btnInactive}`}>
          Link
        </button>

        {/* Image */}
        <button type="button" onClick={() => imageInputRef.current?.click()}
          className={`${btnBase} ${btnInactive}`}>
          Image ↑
        </button>

        <span className="w-px h-5 bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${btnBase} ${btnInactive} disabled:opacity-30`}>
          ↩
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${btnBase} ${btnInactive} disabled:opacity-30`}>
          ↪
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
