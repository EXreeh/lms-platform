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
import { fetchCurrentUser, logoutUser } from "@/lib/auth-api";
import { clearAuthStorage, getDashboardPathForRole, syncMiddlewareCookie } from "@/lib/auth-storage";
import { ApiClientError } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
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
      setUser(response.data.user);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        clearAuthStorage();
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
    (nextUser: User, token?: string) => {
      if (token) {
        syncMiddlewareCookie(token);
      }
      setUser(nextUser);
      router.push(getDashboardPathForRole(nextUser.role));
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Clear local session even if API call fails
    }
    clearAuthStorage();
    setUser(null);
    router.push("/login");
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
