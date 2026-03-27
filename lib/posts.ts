// lib/posts.ts — Firestore CRUD for blog posts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;         // HTML from Tiptap
  coverImage: string;      // Firebase Storage URL
  tags: string[];
  author: { name: string };
  status: "draft" | "published";
  publishedAt: string;     // ISO string (converted from Timestamp)
  updatedAt: string;       // ISO string
}

export interface BlogPostFirestore {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: { name: string };
  status: "draft" | "published";
  publishedAt: Timestamp | null;
  updatedAt: Timestamp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSTS_COLLECTION = "posts";

function toPost(id: string, data: BlogPostFirestore): BlogPost {
  return {
    ...data,
    publishedAt: data.publishedAt
      ? data.publishedAt.toDate().toISOString()
      : new Date().toISOString(),
    updatedAt: data.updatedAt
      ? data.updatedAt.toDate().toISOString()
      : new Date().toISOString(),
  };
}

// ─── Public reads ─────────────────────────────────────────────────────────────

/** Fetch a single published post by slug. Returns null if not found. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("slug", "==", slug),
    where("status", "==", "published")
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return toPost(docSnap.id, docSnap.data() as BlogPostFirestore);
}

/** Fetch all published posts ordered by publishedAt descending. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPost(d.id, d.data() as BlogPostFirestore));
}

/** Return slugs of all published posts (for generateStaticParams). */
export async function getAllBlogSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return posts.map((p) => p.slug);
}

// ─── Admin reads (all statuses) ───────────────────────────────────────────────

/** Fetch ALL posts (draft + published) for the admin dashboard. */
export async function getAllPostsAdmin(): Promise<(BlogPost & { id: string })[]> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...toPost(d.id, d.data() as BlogPostFirestore),
  }));
}

/** Fetch a single post by slug (any status) for the admin editor. */
export async function getPostBySlugAdmin(slug: string): Promise<(BlogPost & { id: string }) | null> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("slug", "==", slug)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...toPost(d.id, d.data() as BlogPostFirestore) };
}

// ─── Admin writes ─────────────────────────────────────────────────────────────

export interface PostInput {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: { name: string };
  status: "draft" | "published";
}

/** Create a new post. Returns the new document ID. */
export async function createPost(input: PostInput): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, POSTS_COLLECTION), {
    ...input,
    publishedAt: input.status === "published" ? Timestamp.now() : null,
    updatedAt: now,
  });
  return ref.id;
}

/** Update an existing post by Firestore document ID. */
export async function updatePost(id: string, input: Partial<PostInput>): Promise<void> {
  const ref = doc(db, POSTS_COLLECTION, id);
  const existing = (await getDoc(ref)).data() as BlogPostFirestore | undefined;

  const isPublishing =
    input.status === "published" &&
    existing?.status !== "published";

  await updateDoc(ref, {
    ...input,
    ...(isPublishing && { publishedAt: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  });
}

/** Delete a post by Firestore document ID. */
export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
}

/** Toggle a post's status between draft and published. */
export async function togglePublish(id: string, currentStatus: "draft" | "published"): Promise<void> {
  const newStatus = currentStatus === "published" ? "draft" : "published";
  const ref = doc(db, POSTS_COLLECTION, id);
  await updateDoc(ref, {
    status: newStatus,
    ...(newStatus === "published" && { publishedAt: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  });
}
