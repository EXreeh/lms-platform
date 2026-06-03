import { apiUrl } from "./constants";
import { getAuthToken } from "./auth-storage";

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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = false, credentials = "include", headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      (requestHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: requestHeaders,
    credentials,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("[API]", apiUrl(path), { status: response.status, body: data });
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
