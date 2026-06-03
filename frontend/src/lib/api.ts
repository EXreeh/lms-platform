import { apiUrl } from "./constants";
import { getAuthToken } from "./auth-storage";
import { logAuth, logAuthError } from "./auth-debug";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public errors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body" | "credentials"> {
  body?: unknown;
  /** Send Authorization Bearer (from bearerToken or localStorage) */
  auth?: boolean;
  /** Fresh token right after login — avoids waiting on cross-origin httpOnly cookie */
  bearerToken?: string;
  /** Defaults to "include" for httpOnly cookie auth across origins */
  credentials?: RequestCredentials;
}

const AUTH_DEBUG_PATHS = [
  "/auth/login",
  "/auth/logout",
  "/auth/me",
  "/auth/register",
  "/auth/password",
];

function shouldLogAuth(path: string): boolean {
  return AUTH_DEBUG_PATHS.some((p) => path.startsWith(p));
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    auth = false,
    bearerToken,
    credentials = "include",
    headers,
    ...rest
  } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = bearerToken ?? getAuthToken();
    if (token) {
      (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  const url = apiUrl(path);
  const logAuthRequest = shouldLogAuth(path);

  if (logAuthRequest) {
    logAuth(`request:${path}`, {
      method: rest.method ?? "GET",
      hasBearer: Boolean((requestHeaders as Record<string, string>).Authorization),
      credentials,
    });
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    credentials,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (logAuthRequest) {
    logAuth(`response:${path}`, {
      status: response.status,
      ok: response.ok,
      code: (data as { code?: string }).code,
      message: (data as { message?: string }).message,
    });
  }

  if (!response.ok) {
    if (logAuthRequest) {
      logAuthError(`failed:${path}`, {
        status: response.status,
        url,
        body: data,
      });
    } else if (process.env.NODE_ENV === "development") {
      console.error("[API]", url, { status: response.status, body: data });
    }
    throw new ApiClientError(
      data.message ?? "Request failed",
      response.status,
      data.code,
      data.errors,
    );
  }

  return data as T;
}
