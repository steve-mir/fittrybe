// lib/uploadImage.ts — Upload an image to Firebase Storage and return the public URL
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a File to Firebase Storage under blog-images/{uuid}-{filename}.
 * Returns the public download URL.
 */
export async function uploadImage(file: File): Promise<string> {
  const uuid = crypto.randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `blog-images/${uuid}-${safeFilename}`;

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public, max-age=31536000",
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
