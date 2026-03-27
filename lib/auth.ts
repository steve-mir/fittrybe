// lib/auth.ts — Firebase Auth helpers
"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

/** Sign in with email and password. Throws on failure. */
export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Get the currently signed-in user (null if not signed in). */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Get a Firebase ID token for the current user (for server-side verification). */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
