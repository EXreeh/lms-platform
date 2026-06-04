import { env } from "../../config/env.js";

/** Resolved From header (no secrets). */
export function resolveEmailFrom(): string {
  const configured = env.EMAIL_FROM?.trim();

  if (env.EMAIL_PROVIDER === "resend") {
    return configured || "CognitiaX AI <onboarding@resend.dev>";
  }

  const user = env.SMTP_USER?.trim();
  if (configured && user && configured.includes(user)) {
    return configured;
  }
  if (user) {
    return `CognitiaX AI <${user}>`;
  }
  return configured || "CognitiaX AI <noreply@cognitiax.ai>";
}
