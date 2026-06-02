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
import type { User } from "@/types/auth";
import { fetchCurrentUser } from "@/lib/auth-api";
import { getDashboardPathForRole, syncMiddlewareCookie } from "@/lib/auth-storage";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import {
  destroySession,
  isAuthSessionError,
  isValidUser,
} from "@/lib/auth-session";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token?: string, redirectTo?: string | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetchCurrentUser();
      const nextUser = response.data.user;

      if (!isValidUser(nextUser)) {
        await destroySession();
        setUser(null);
        return;
      }

      setUser(nextUser);
    } catch (error) {
      if (isAuthSessionError(error)) {
        await destroySession();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(
    (nextUser: User, token?: string, redirectTo?: string | null) => {
      if (!isValidUser(nextUser)) return;
      if (token) {
        syncMiddlewareCookie(token);
      }
      setUser(nextUser);
      const safe = getSafeRedirectPath(redirectTo ?? null);
      router.push(safe ?? getDashboardPathForRole(nextUser.role));
    },
    [router],
  );

  const logout = useCallback(async () => {
    await destroySession();
    setUser(null);
    router.push("/");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
