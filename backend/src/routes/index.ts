import { Router } from "express";
import { prisma } from "../config/database.js";
import { generalApiRateLimiter } from "../middleware/rate-limit.js";
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
import { feesRoutes } from "../modules/fees/fees.routes.js";
import { batchesRoutes } from "../modules/batches/batches.routes.js";
import { messagesRoutes } from "../modules/messages/messages.routes.js";
import {
  adminLiveClassesRoutes,
  liveClassesRoutes,
  recordingsRoutes,
  studentLiveClassesRoutes,
  teacherLiveClassesRoutes,
} from "../modules/live-classes/live-classes.routes.js";
import { courseAccessRoutes } from "../modules/course-access/course-access.routes.js";
import { teacherSalaryRoutes } from "../modules/teacher-salary/teacher-salary.routes.js";
import { teacherAttendanceRoutes } from "../modules/teacher-attendance/teacher-attendance.routes.js";

export const apiRouter = Router();

apiRouter.use(generalApiRateLimiter);

apiRouter.get("/health", async (_req, res) => {
  const started = Date.now();
  console.log("[Health] GET /health hit");

  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const status = database === "connected" ? "ok" : "degraded";
  const ms = Date.now() - started;
  console.log(`[Health] GET /health ${status} — ${ms}ms database=${database}`);

  res.status(status === "ok" ? 200 : 503).json({
    status,
    app: "CognitiaX AI LMS",
    timestamp: new Date().toISOString(),
    database,
    responseMs: ms,
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
apiRouter.use("/fees", feesRoutes);
apiRouter.use("/batches", batchesRoutes);
apiRouter.use("/messages", messagesRoutes);
apiRouter.use("/admin/live-classes", adminLiveClassesRoutes);
apiRouter.use("/teacher/live-classes", teacherLiveClassesRoutes);
apiRouter.use("/student/live-classes", studentLiveClassesRoutes);
apiRouter.use("/live-classes", liveClassesRoutes);
apiRouter.use("/recordings", recordingsRoutes);
apiRouter.use("/course-access", courseAccessRoutes);
apiRouter.use("/teacher-salaries", teacherSalaryRoutes);
apiRouter.use("/teacher-attendance", teacherAttendanceRoutes);
