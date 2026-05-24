import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface ResetTokenPayload {
  email: string;
  purpose: "password_reset";
}

export function signResetToken(email: string): string {
  return jwt.sign({ email, purpose: "password_reset" } satisfies ResetTokenPayload, env.JWT_SECRET, {
    expiresIn: env.RESET_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyResetToken(token: string): ResetTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & ResetTokenPayload;

  if (decoded.purpose !== "password_reset" || !decoded.email) {
    throw new Error("Invalid reset token");
  }

  return { email: decoded.email, purpose: "password_reset" };
}
