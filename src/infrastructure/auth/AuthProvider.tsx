"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshTokenRequest,
  resetPasswordRequest,
} from "@/infrastructure/api/auth";
import { setUnauthorizedHandler } from "@/infrastructure/api/client";
import { clearToken, getToken, setToken } from "@/infrastructure/auth/token-storage";
import { can as canPermission, homePathForUser } from "@/shared/lib/permissions";
import type { AuthUser } from "@/shared/types/api.types";
import { ApiError } from "@/shared/types/api.types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  can: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: {
    email: string;
    password: string;
    password_confirmation: string;
    token: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setStatus("anonymous");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setStatus("anonymous");
      return;
    }

    try {
      const me = await meRequest();
      setUser(me);
      setStatus("authenticated");
    } catch {
      clearToken();
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  // Rotation manuelle du token uniquement — ne JAMAIS déclencher ceci
  // automatiquement (interval, focus de fenêtre, etc). POST /auth/refresh
  // révoque le token courant avant d'en émettre un nouveau (côté API) ; tout
  // appel réseau encore en vol avec l'ancien token à ce moment-là reçoit un
  // 401, ce qui déclenche la déconnexion globale (`onUnauthorized` dans
  // client.ts) et efface même le nouveau token pourtant valide — un
  // précédent déclenchement automatique (toutes les 45 min + à chaque focus)
  // provoquait des déconnexions aléatoires sur les sessions longues/multi-
  // onglets. Les tokens Sanctum n'expirent pas ici (`sanctum.expiration =
  // null`), donc cette rotation n'apporte aucun bénéfice à automatiser.
  const refreshToken = useCallback(async () => {
    if (!getToken()) return false;
    try {
      const result = await refreshTokenRequest();
      setToken(result.token);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return homePathForUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await logoutRequest();
      }
    } catch {
      // ignore network errors on logout
    } finally {
      clearToken();
      setUser(null);
      setStatus("anonymous");
      router.replace("/login");
    }
  }, [router]);

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordRequest(email);
  }, []);

  const resetPassword = useCallback(
    async (input: {
      email: string;
      password: string;
      password_confirmation: string;
      token: string;
    }) => {
      await resetPasswordRequest(input);
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      can: (permission: string) => canPermission(user, permission),
      login,
      logout,
      refreshUser,
      refreshToken,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      status,
      login,
      logout,
      refreshUser,
      refreshToken,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  }
  return ctx;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = Object.values(error.errors)[0]?.[0];
    return first || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue.";
}
