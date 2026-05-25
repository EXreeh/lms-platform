import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { coursesRoutes } from "../modules/courses/courses.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Cognitiax AI LMS API is running",
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/courses", coursesRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
