import type { CorsOptions } from "cors";
import { env, corsOrigins } from "./env.js";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;
const ALLOWED_HEADERS = ["Content-Type", "Authorization"];

/** Exact origins allowed (never use "*" with credentials). */
const allowedOriginSet = new Set(corsOrigins);

export function getCorsOptions(): CorsOptions {
  return {
    origin(origin, callback) {
      // Server-to-server, curl, or same-origin requests without Origin header
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOriginSet.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: [...ALLOWED_METHODS],
    allowedHeaders: [...ALLOWED_HEADERS],
    optionsSuccessStatus: 204,
  };
}

export function logCorsConfig(): void {
  if (env.NODE_ENV === "production" && process.env.AUTH_DEBUG !== "true") return;
  console.log("CORS allowed origins:", [...allowedOriginSet]);
  console.log("CORS credentials:", true);
  console.log("FRONTEND_URL:", env.FRONTEND_URL);
}
