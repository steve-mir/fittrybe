// components/admin/ImageUpload.tsx — Cover image uploader
"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/uploadImage";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-sm text-white/60 mb-2 font-[family-name:var(--font-dm-sans)]">
        Cover Image
      </label>

      {value ? (
        <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-white/5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-4 py-2 bg-red-500/80 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-colors font-[family-name:var(--font-dm-sans)]"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[16/9] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#B6FF00]/30 hover:bg-white/5 transition-all disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-[#B6FF00]/30 border-t-[#B6FF00] rounded-full animate-spin" />
              <span className="text-sm text-white/40 font-[family-name:var(--font-dm-sans)]">
                Uploading…
              </span>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-white/40 font-[family-name:var(--font-dm-sans)]">
                Click to upload cover image
              </span>
              <span className="text-xs text-white/20 font-[family-name:var(--font-dm-sans)]">
                JPG, PNG, WebP · max 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400 font-[family-name:var(--font-dm-sans)]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
