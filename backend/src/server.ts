import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { verifyEmailTransport } from "./services/email/email.service.js";
import { ensureUploadDirectories } from "./services/storage/index.js";
import { logCorsConfig } from "./config/cors.js";

const app = createApp();

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected");
    logCorsConfig();

    if (env.STORAGE_PROVIDER === "local") {
      await ensureUploadDirectories();
    }

    await verifyEmailTransport();

    app.listen(env.PORT, () => {
      console.log(`LMS API running on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
