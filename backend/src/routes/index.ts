import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { coursesRoutes } from "../modules/courses/courses.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { learningRoutes } from "../modules/learning/learning.routes.js";
import { quizzesRoutes, quizAttemptRoutes } from "../modules/quizzes/quizzes.routes.js";
import { resourcesRoutes } from "../modules/resources/resources.routes.js";
import { certificatesRoutes } from "../modules/certificates/certificates.routes.js";
import { paymentsRoutes } from "../modules/payments/payments.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "CognitiaX AI LMS API is running",
    timestamp: new Date().toISOString(),
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
apiRouter.use("/admin", adminRoutes);
