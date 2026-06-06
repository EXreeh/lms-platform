import type { Role } from "@lms/database";
import { env, isEmailProviderConfigured } from "../../config/env.js";
import { sendEmail } from "../../services/email/email.service.js";
import { accountCredentialsEmail } from "../../services/email/templates/account-credentials.js";
import * as messagesService from "../messages/messages.service.js";

export async function notifyAccountCredentials(params: {
  actorId: string;
  userId: string;
  firstName: string;
  email: string;
  password: string;
  role: Extract<Role, "STUDENT" | "TEACHER">;
}) {
  const loginUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/login`;
  const roleLabel = params.role === "STUDENT" ? "student" : "teacher";

  const content = [
    "Welcome to the CognitiaX AI institute portal.",
    "",
    `Your ${roleLabel} account has been created by institute administration.`,
    "",
    `Sign in: ${loginUrl}`,
    `Email: ${params.email}`,
    `Temporary password: ${params.password}`,
    "",
    "Please sign in and change your password after your first login.",
    "Contact your institute administrator if you need assistance.",
  ].join("\n");

  await messagesService.sendMessage({
    senderId: params.actorId,
    senderRole: "ADMIN",
    recipientIds: [params.userId],
    subject: "Your CognitiaX AI login credentials",
    content,
    type: "ANNOUNCEMENT",
  });

  if (!isEmailProviderConfigured) {
    return { messageSent: true, emailSent: false };
  }

  try {
    const template = accountCredentialsEmail({
      firstName: params.firstName,
      email: params.email,
      temporaryPassword: params.password,
      loginUrl,
      roleLabel,
    });
    await sendEmail({ to: params.email, ...template });
    return { messageSent: true, emailSent: true };
  } catch (error) {
    console.error("[Admin] Credentials email failed:", error);
    return { messageSent: true, emailSent: false };
  }
}
