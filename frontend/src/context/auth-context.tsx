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
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types/auth";
import {
  AUTH_LOGIN_ME_TIMEOUT_MS,
  AuthMeTimeoutError,
  fetchCurrentUser,
  logoutUser,
} from "@/lib/auth-api";
import { getAuthToken, syncMiddlewareCookie } from "@/lib/auth-storage";
import { getDashboardRedirectForRole } from "@/lib/safe-redirect";
import { logAuth, logAuthError } from "@/lib/auth-debug";
import { ApiClientError } from "@/lib/api";
import {
  clearClientAuthState,
  isAuthSessionError,
  isValidUser,
} from "@/lib/auth-session";
import { getRouteAuthKind, isPublicAuthPath } from "@/lib/auth-routes";
import {
  hasInitialAuthCheck,
  markInitialAuthCheckDone,
  resetInitialAuthCheck,
} from "@/lib/auth-bootstrap";
const LOGOUT_API_TIMEOUT_MS = 2500;

interface AuthContextValue {
  user: User | null;
  /** Bumps on login/logout to remount session-scoped UI */
  sessionKey: number;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  /** True when /me timed out or backend was slow */
  authDegraded: boolean;
  resetAuthState: () => void;
  login: (token: string, redirectTo?: string | null) => Promise<void>;
  logout: () => void;
  refreshUser: (options?: {
    force?: boolean;
    bearerToken?: string;
    silent?: boolean;
    timeoutMs?: number;
  }) => Promise<User | null>;
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

function shouldBlockForAuth(pathname: string): boolean {
  return getRouteAuthKind(pathname) === "protected";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [isLoading, setIsLoading] = useState(() => {
    if (hasInitialAuthCheck()) return false;
    if (typeof window !== "undefined" && isPublicAuthPath(window.location.pathname)) {
      return false;
    }
    return shouldBlockForAuth(pathname);
  });
  const [authDegraded, setAuthDegraded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const meInFlight = useRef<Promise<User | null> | null>(null);
  const meAbortRef = useRef<AbortController | null>(null);
  const sessionEpoch = useRef(0);
  const isLoggingOutRef = useRef(false);
  const logoutEpochRef = useRef(0);
  const bootstrapped = useRef(false);
  const protectedCheckStarted = useRef(false);

  const bumpSessionKey = useCallback(() => {
    setSessionKey((k) => k + 1);
  }, []);

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
    setAuthDegraded(false);
    setIsLoading(false);
    resetInitialAuthCheck();
    clearClientAuthState();
  }, [abortPendingMe, applyUser]);

  const refreshUser = useCallback(
    async (options?: {
      force?: boolean;
      bearerToken?: string;
      epoch?: number;
      silent?: boolean;
      timeoutMs?: number;
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
            timeoutMs: options?.timeoutMs,
          });
          const nextUser = response.data.user;

          if (epoch !== sessionEpoch.current || isLoggingOutRef.current) {
            logAuth("me:stale-ignored", { epoch, current: sessionEpoch.current });
            return null;
          }

          if (!isValidUser(nextUser)) {
            if (!isLoggingOutRef.current) {
              clearClientAuthState();
            }
            applyUser(null);
            logAuth("check:fail", { reason: "invalid-user" });
            return null;
          }

          setAuthDegraded(false);
          applyUser(nextUser);
          logAuth("check:success", { userId: nextUser.id, role: nextUser.role });
          return nextUser;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return null;
          }

          if (epoch !== sessionEpoch.current || isLoggingOutRef.current) {
            return null;
          }

          if (error instanceof AuthMeTimeoutError) {
            logAuthError("check:timeout");
            logAuthError("me:timeout");
            clearClientAuthState();
            applyUser(null);
            setAuthDegraded(true);
            return null;
          }

          const detail =
            error instanceof ApiClientError
              ? { status: error.status, code: error.code, message: error.message }
              : { message: error instanceof Error ? error.message : "unknown" };
          logAuthError("check:fail", detail);
          logAuthError("me:failed", detail);

          if (error instanceof TypeError) {
            setAuthDegraded(true);
            clearClientAuthState();
            applyUser(null);
            return null;
          }

          if (isAuthSessionError(error) && !isLoggingOutRef.current) {
            clearClientAuthState();
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

  const runSessionCheck = useCallback(
    async (opts?: { silent?: boolean; bearerToken?: string; force?: boolean }) => {
      const routeKind = getRouteAuthKind(pathname);
      logAuth(routeKind === "public" ? "route:public" : "route:protected", { pathname });
      logAuth("check:started", { pathname, silent: Boolean(opts?.silent) });

      if (!opts?.silent && shouldBlockForAuth(pathname)) {
        setIsLoading(true);
      }

      try {
        await refreshUser({
          force: opts?.force,
          bearerToken: opts?.bearerToken,
          silent: opts?.silent,
        });
      } finally {
        markInitialAuthCheckDone();
        if (!opts?.silent && shouldBlockForAuth(pathname)) {
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [pathname, refreshUser],
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    if (hasInitialAuthCheck()) {
      setIsLoading(false);
      return;
    }

    if (isPublicAuthPath(pathname)) {
      logAuth("route:public", { pathname });
      markInitialAuthCheckDone();
      setIsLoading(false);

      if (getAuthToken()) {
        void runSessionCheck({ silent: true });
      }
      return;
    }

    void runSessionCheck();
  }, [pathname, runSessionCheck]);

  useEffect(() => {
    protectedCheckStarted.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!hasInitialAuthCheck()) return;
    if (isPublicAuthPath(pathname)) return;
    if (user || isLoggingOutRef.current) return;
    if (!shouldBlockForAuth(pathname)) return;
    if (protectedCheckStarted.current) return;

    protectedCheckStarted.current = true;
    void runSessionCheck().finally(() => {
      protectedCheckStarted.current = false;
    });
  }, [pathname, user, runSessionCheck]);

  const login = useCallback(
    async (token: string, redirectTo?: string | null) => {
      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
      setAuthDegraded(false);
      sessionEpoch.current += 1;
      const epoch = sessionEpoch.current;
      abortPendingMe();
      resetInitialAuthCheck();

      logAuth("login:establish-session", { epoch });
      applyUser(null);
      clearClientAuthState();
      syncMiddlewareCookie(token);
      setIsLoading(false);

      const nextUser = await refreshUser({
        force: true,
        bearerToken: token,
        epoch,
        timeoutMs: AUTH_LOGIN_ME_TIMEOUT_MS,
      });

      if (!nextUser || epoch !== sessionEpoch.current) {
        logAuthError("login:session-not-established", { epoch });
        throw new ApiClientError(
          "Session could not be verified after login.",
          401,
          "SESSION_VERIFY_FAILED",
        );
      }

      markInitialAuthCheckDone();
      bumpSessionKey();
      const destination = getDashboardRedirectForRole(nextUser.role, redirectTo);

      router.replace(destination);
      router.refresh();
      logAuth("login:fresh-user", {
        userId: nextUser.id,
        role: nextUser.role,
        destination,
      });
    },
    [abortPendingMe, applyUser, bumpSessionKey, refreshUser, router],
  );

  const logout = useCallback(() => {
    sessionEpoch.current += 1;
    logoutEpochRef.current = sessionEpoch.current;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);
    abortPendingMe();
    resetInitialAuthCheck();

    logAuth("logout:start");
    applyUser(null);
    setAuthDegraded(false);
    setIsLoading(false);
    clearClientAuthState();
    bumpSessionKey();

    router.replace("/login");
    router.refresh();

    void (async () => {
      const epochAtLogout = logoutEpochRef.current;
      try {
        await logoutWithTimeout(LOGOUT_API_TIMEOUT_MS);
        logAuth("logout:api-ok");
      } catch (error) {
        logAuth("logout:api-failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
      } finally {
        if (epochAtLogout !== sessionEpoch.current) {
          logAuth("logout:skipped-stale", { epochAtLogout, current: sessionEpoch.current });
          return;
        }
        clearClientAuthState();
        isLoggingOutRef.current = false;
        setIsLoggingOut(false);
        logAuth("logout:done");
      }
    })();
  }, [abortPendingMe, applyUser, bumpSessionKey, router]);

  const isAuthenticated = Boolean(user) && !isLoggingOut;
  const blocksUI = shouldBlockForAuth(pathname);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: isLoggingOut ? null : user,
      sessionKey,
      isLoading: blocksUI && isLoading && !isLoggingOut && user === null,
      isLoggingOut,
      isAuthenticated,
      authDegraded,
      resetAuthState,
      login,
      logout,
      refreshUser,
    }),
    [
      user,
      sessionKey,
      isLoading,
      isLoggingOut,
      isAuthenticated,
      authDegraded,
      blocksUI,
      resetAuthState,
      login,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <div key={sessionKey}>{children}</div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
