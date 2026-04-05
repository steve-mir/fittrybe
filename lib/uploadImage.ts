// lib/uploadImage.ts — Upload an image to Supabase Storage and return the public URL
import { supabase } from "./supabase";

/**
 * Upload a File to Supabase Storage under blog-images/{uuid}-{filename}.
 * Returns the public download URL.
 */
export async function uploadImage(file: File): Promise<string> {
  const uuid = crypto.randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${uuid}-${safeFilename}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000",
    });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
