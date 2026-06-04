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
import { fetchCurrentUser, logoutUser } from "@/lib/auth-api";
import { getDashboardPathForRole, syncMiddlewareCookie } from "@/lib/auth-storage";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { logAuth, logAuthError } from "@/lib/auth-debug";
import { ApiClientError } from "@/lib/api";
import {
  clearClientAuthState,
  destroySession,
  isAuthSessionError,
  isValidUser,
} from "@/lib/auth-session";
import {
  hasInitialAuthCheck,
  markInitialAuthCheckDone,
} from "@/lib/auth-bootstrap";

const LOGOUT_API_TIMEOUT_MS = 2500;

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  /** Clear client auth before a new login request */
  resetAuthState: () => void;
  login: (token: string, redirectTo?: string | null) => Promise<void>;
  logout: () => void;
  refreshUser: (options?: { force?: boolean; bearerToken?: string }) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function logoutWithTimeout(ms: number): Promise<void> {
  await Promise.race([
    logoutUser().then(() => undefined),
    new Promise<undefined>((_, reject) => {
      setTimeout(() => reject(new Error("logout timeout")), ms);
    }),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !hasInitialAuthCheck());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const meInFlight = useRef<Promise<User | null> | null>(null);
  const meAbortRef = useRef<AbortController | null>(null);
  const sessionEpoch = useRef(0);
  const isLoggingOutRef = useRef(false);

  const abortPendingMe = useCallback(() => {
    meAbortRef.current?.abort();
    meAbortRef.current = null;
    meInFlight.current = null;
  }, []);

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    logAuth("state:updated", {
      userId: nextUser?.id ?? null,
      role: nextUser?.role ?? null,
    });
  }, []);

  const resetAuthState = useCallback(() => {
    sessionEpoch.current += 1;
    abortPendingMe();
    applyUser(null);
    setIsLoading(false);
    clearClientAuthState();
  }, [abortPendingMe, applyUser]);

  const refreshUser = useCallback(
    async (options?: {
      force?: boolean;
      bearerToken?: string;
      epoch?: number;
    }): Promise<User | null> => {
      if (isLoggingOutRef.current) {
        return null;
      }

      if (meInFlight.current && !options?.force) {
        return meInFlight.current;
      }

      const epoch = options?.epoch ?? sessionEpoch.current;

      const run = async (): Promise<User | null> => {
        if (isLoggingOutRef.current) {
          return null;
        }

        logAuth("me:fetch", { hasBearer: Boolean(options?.bearerToken), epoch });

        const controller = new AbortController();
        meAbortRef.current = controller;

        try {
          const response = await fetchCurrentUser({
            bearerToken: options?.bearerToken,
            signal: controller.signal,
          });
          const nextUser = response.data.user;

          if (epoch !== sessionEpoch.current || isLoggingOutRef.current) {
            logAuth("me:stale-ignored", { epoch, current: sessionEpoch.current });
            return null;
          }

          if (!isValidUser(nextUser)) {
            if (!isLoggingOutRef.current) {
              await destroySession();
            }
            applyUser(null);
            return null;
          }

          applyUser(nextUser);
          logAuth("me:ok", { userId: nextUser.id, role: nextUser.role });
          return nextUser;
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            return null;
          }

          if (epoch !== sessionEpoch.current || isLoggingOutRef.current) {
            return null;
          }

          const detail =
            error instanceof ApiClientError
              ? { status: error.status, code: error.code, message: error.message }
              : { message: error instanceof Error ? error.message : "unknown" };
          logAuthError("me:failed", detail);

          if (isAuthSessionError(error) && !isLoggingOutRef.current) {
            await destroySession();
            applyUser(null);
          }
          return null;
        } finally {
          if (meAbortRef.current === controller) {
            meAbortRef.current = null;
          }
        }
      };

      const promise = run().finally(() => {
        if (meInFlight.current === promise) {
          meInFlight.current = null;
        }
      });
      meInFlight.current = promise;
      return promise;
    },
    [applyUser],
  );

  useEffect(() => {
    if (hasInitialAuthCheck()) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      await refreshUser();
      markInitialAuthCheckDone();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(
    async (token: string, redirectTo?: string | null) => {
      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
      sessionEpoch.current += 1;
      const epoch = sessionEpoch.current;
      abortPendingMe();

      logAuth("login:establish-session", { epoch });
      applyUser(null);
      clearClientAuthState();
      syncMiddlewareCookie(token);
      setIsLoading(false);

      const nextUser = await refreshUser({
        force: true,
        bearerToken: token,
        epoch,
      });

      if (!nextUser || epoch !== sessionEpoch.current) {
        logAuthError("login:session-not-established", { epoch });
        throw new ApiClientError(
          "Session could not be verified after login.",
          401,
          "SESSION_VERIFY_FAILED",
        );
      }

      const safe = getSafeRedirectPath(redirectTo ?? null);
      const destination = safe ?? getDashboardPathForRole(nextUser.role);

      router.replace(destination);
      logAuth("login:done", { destination, role: nextUser.role });
    },
    [abortPendingMe, applyUser, refreshUser, router],
  );

  const logout = useCallback(() => {
    sessionEpoch.current += 1;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    abortPendingMe();

    logAuth("logout:start");
    applyUser(null);
    setIsLoading(false);
    clearClientAuthState();

    router.replace("/login");

    void (async () => {
      try {
        await logoutWithTimeout(LOGOUT_API_TIMEOUT_MS);
        logAuth("logout:api-ok");
      } catch (error) {
        logAuth("logout:api-failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
      } finally {
        clearClientAuthState();
        isLoggingOutRef.current = false;
        setIsLoggingOut(false);
        logAuth("logout:done");
      }
    })();
  }, [abortPendingMe, applyUser, router]);

  const isAuthenticated = Boolean(user) && !isLoggingOut;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: isLoggingOut ? null : user,
      isLoading: isLoading && !isLoggingOut && user === null,
      isLoggingOut,
      isAuthenticated,
      resetAuthState,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, isLoggingOut, isAuthenticated, resetAuthState, login, logout, refreshUser],
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
