import type { Role } from "@lms/database";
import { normalizeAppRole } from "../../utils/roles.js";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: normalizeAppRole(user.role),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
