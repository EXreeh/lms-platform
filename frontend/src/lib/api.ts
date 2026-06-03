import { apiUrl } from "./constants";
import { logAuth } from "./auth-debug";

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
  auth?: boolean;
  /** Defaults to "include" for httpOnly cookie auth across origins */
  credentials?: RequestCredentials;
}

const AUTH_DEBUG_PATHS = ["/auth/login", "/auth/logout", "/auth/me", "/auth/register"];

function shouldLogAuth(path: string): boolean {
  return AUTH_DEBUG_PATHS.some((p) => path.startsWith(p));
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, credentials = "include", headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const url = apiUrl(path);
  const logAuthRequest = shouldLogAuth(path);

  if (logAuthRequest) {
    logAuth(`request:${path}`, { method: rest.method ?? "GET" });
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    credentials,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (logAuthRequest) {
    logAuth(`response:${path}`, { status: response.status, ok: response.ok });
  }

  if (!response.ok) {
    if (process.env.NODE_ENV === "development") {
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
