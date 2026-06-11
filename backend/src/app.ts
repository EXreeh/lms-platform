import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { getCorsOptions } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import { getUploadsBasePath } from "./services/storage/index.js";
import { setUploadStaticHeaders } from "./utils/static-upload-headers.js";

export function createApp() {
  const app = express();

  // Required behind Railway/reverse proxies so secure cookies and HTTPS behave correctly
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use(cors(getCorsOptions()));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (env.STORAGE_PROVIDER === "local" || env.NODE_ENV !== "production") {
    app.use(
      "/uploads",
      express.static(getUploadsBasePath(), {
        maxAge: env.NODE_ENV === "production" ? "1d" : 0,
        setHeaders(res, filePath) {
          setUploadStaticHeaders(res, filePath);
        },
      }),
    );
  }

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
