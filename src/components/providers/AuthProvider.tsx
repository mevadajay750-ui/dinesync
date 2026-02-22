"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types/user";
import type { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  setError: (error: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }
    try {
      const { getUserById } = await import("@/services/user.service");
      const profile = await getUserById(firebaseUser.uid);
      setUser(profile ?? null);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setUser(null);
    }
  }, [firebaseUser]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      const { subscribeToAuthState } = await import("@/lib/firebase/auth");
      unsubscribe = subscribeToAuthState(async (fbUser) => {
        setFirebaseUser(fbUser);
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          await fetch("/api/auth/session", { method: "DELETE" });
          return;
        }
        try {
          const token = await fbUser.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const { getUserById } = await import("@/services/user.service");
          const profile = await getUserById(fbUser.uid);
          setUser(profile ?? null);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
    })();
    return () => {
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      error,
      setError,
      refreshUser,
    }),
    [firebaseUser, user, loading, error, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
