import { Router } from "express";
import { prisma } from "../config/database.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { coursesRoutes } from "../modules/courses/courses.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { learningRoutes } from "../modules/learning/learning.routes.js";
import { quizzesRoutes, quizAttemptRoutes } from "../modules/quizzes/quizzes.routes.js";
import { resourcesRoutes } from "../modules/resources/resources.routes.js";
import { certificatesRoutes } from "../modules/certificates/certificates.routes.js";
import { paymentsRoutes } from "../modules/payments/payments.routes.js";
import { uploadsRoutes } from "../modules/uploads/uploads.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", async (_req, res) => {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const status = database === "connected" ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    app: "CognitiaX AI LMS",
    timestamp: new Date().toISOString(),
    database,
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/courses", coursesRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/learning", learningRoutes);
apiRouter.use("/quizzes", quizzesRoutes);
apiRouter.use("/quiz-attempts", quizAttemptRoutes);
apiRouter.use("/resources", resourcesRoutes);
apiRouter.use("/certificates", certificatesRoutes);
apiRouter.use("/payments", paymentsRoutes);
apiRouter.use("/uploads", uploadsRoutes);
apiRouter.use("/admin", adminRoutes);
