import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);

dashboardRoutes.get(
  "/student",
  authorize("STUDENT"),
  (_req, res) => {
    res.json({
      success: true,
      data: {
        dashboard: "student",
        message: "Student dashboard — courses and progress coming soon",
      },
    });
  },
);

dashboardRoutes.get(
  "/teacher",
  authorize("TEACHER"),
  (_req, res) => {
    res.json({
      success: true,
      data: {
        dashboard: "teacher",
        message: "Teacher dashboard — course management coming soon",
      },
    });
  },
);

dashboardRoutes.get(
  "/admin",
  authorize("ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      data: {
        dashboard: "admin",
        message: "Admin dashboard — platform management coming soon",
      },
    });
  },
);
