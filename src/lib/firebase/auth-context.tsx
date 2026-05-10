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
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./config";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    const failSafe = window.setTimeout(() => {
      setLoading(false);
    }, 12_000);
    try {
      const auth = getFirebaseAuth();
      /** Session restore can lag the first listener tick; read sync state so UI does not hang. */
      const initial = auth.currentUser;
      setUser(initial);
      if (initial) setLoading(false);

      unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });

      /** Clears "Signing you in…" when persistence restore finishes (Safari, PWA, slow networks). */
      void auth.authStateReady().then(() => {
        setLoading(false);
      });
    } catch {
      setUser(null);
      setLoading(false);
    }
    return () => {
      window.clearTimeout(failSafe);
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      throw new Error("Firebase is not configured.");
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured(),
      signInWithGoogle,
      signOut,
    }),
    [user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
