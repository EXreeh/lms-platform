"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/auth";
import { fetchCurrentUser } from "@/lib/auth-api";
import {
  clearAuthStorage,
  getDashboardPathForRole,
  syncMiddlewareCookie,
} from "@/lib/auth-storage";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { logAuth } from "@/lib/auth-debug";
import {
  destroySession,
  isAuthSessionError,
  isValidUser,
} from "@/lib/auth-session";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, redirectTo?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (options?: { force?: boolean }) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const meInFlight = useRef<Promise<User | null> | null>(null);
  const hasBootstrapped = useRef(false);

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    logAuth("state:updated", {
      userId: nextUser?.id ?? null,
      role: nextUser?.role ?? null,
    });
  }, []);

  const refreshUser = useCallback(async (options?: { force?: boolean }): Promise<User | null> => {
    if (meInFlight.current && !options?.force) {
      return meInFlight.current;
    }

    const run = async (): Promise<User | null> => {
      logAuth("me:fetch");
      try {
        const response = await fetchCurrentUser();
        const nextUser = response.data.user;

        if (!isValidUser(nextUser)) {
          await destroySession();
          applyUser(null);
          return null;
        }

        applyUser(nextUser);
        logAuth("me:ok", { userId: nextUser.id, role: nextUser.role });
        return nextUser;
      } catch (error) {
        if (isAuthSessionError(error)) {
          await destroySession();
          applyUser(null);
          logAuth("me:unauthorized");
        }
        return null;
      }
    };

    const promise = run().finally(() => {
      if (meInFlight.current === promise) {
        meInFlight.current = null;
      }
    });
    meInFlight.current = promise;
    return promise;
  }, [applyUser]);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    void (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(
    async (token: string, redirectTo?: string | null) => {
      logAuth("login:start");
      applyUser(null);
      clearAuthStorage();
      syncMiddlewareCookie(token);

      const nextUser = await refreshUser({ force: true });
      if (!nextUser) {
        throw new Error("Unable to establish session after login");
      }

      const safe = getSafeRedirectPath(redirectTo ?? null);
      const destination = safe ?? getDashboardPathForRole(nextUser.role);

      router.refresh();
      router.push(destination);
      logAuth("login:done", { destination, role: nextUser.role });
    },
    [applyUser, refreshUser, router],
  );

  const logout = useCallback(async () => {
    logAuth("logout:start");
    applyUser(null);
    setIsLoading(false);

    await destroySession();

    router.refresh();
    router.push("/");
    logAuth("logout:done");
  }, [applyUser, router]);

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
