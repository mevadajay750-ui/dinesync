"use client";

import { useCallback } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export function useAuth() {
  const { firebaseUser, user, loading, error, setError, refreshUser } = useAuthContext();

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const { signInWithEmail } = await import("@/lib/firebase/auth");
        await signInWithEmail(email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign in failed";
        setError(message);
        throw err;
      }
    },
    [setError]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null);
      try {
        const { signUpWithEmail } = await import("@/lib/firebase/auth");
        await signUpWithEmail(email, password, name);
        await refreshUser();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign up failed";
        setError(message);
        throw err;
      }
    },
    [setError, refreshUser]
  );

  const signInWithGoogleHandler = useCallback(async () => {
    setError(null);
    try {
      const { signInWithGoogle, signOut: firebaseSignOut } = await import("@/lib/firebase/auth");
      const cred = await signInWithGoogle();
      const { getUserById } = await import("@/services/user.service");
      const existing = await getUserById(cred.user.uid);
      if (!existing) {
        setError("No organization found. Please register first with email.");
        await firebaseSignOut();
        throw new Error("No organization found");
      }
    } catch (err) {
      if (err instanceof Error && err.message !== "No organization found") {
        setError(err.message);
      }
      throw err;
    }
  }, [setError]);

  const signOut = useCallback(async () => {
    setError(null);
    const { signOut: firebaseSignOut } = await import("@/lib/firebase/auth");
    await firebaseSignOut();
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    error,
    setError,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle: signInWithGoogleHandler,
    signOut,
    refreshUser,
  };
}
