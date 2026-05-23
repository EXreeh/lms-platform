import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@lms/database";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.sub,
  };

  return jwt.sign({ email: payload.email, role: payload.role }, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

  if (!decoded.sub || !decoded.email || !decoded.role) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: decoded.sub,
    email: decoded.email as string,
    role: decoded.role as Role,
  };
}
