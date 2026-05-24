import rateLimit from "express-rate-limit";

/** Stricter rate limit for OTP send/verify endpoints */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMIT",
  },
});

export const checkEmailRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many email checks. Please slow down.",
    code: "RATE_LIMIT",
  },
});
