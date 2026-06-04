import { env, isResendConfigured } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";
import { resolveEmailFrom } from "../resolve-from.js";
import type { EmailPayload } from "../types.js";
import { EMAIL_USER_MESSAGES } from "../types.js";

const RESEND_API_URL = "https://api.resend.com/emails";

interface ResendErrorBody {
  message?: string;
  name?: string;
  statusCode?: number;
}

function logResendError(context: string, status: number, body: ResendErrorBody | null): void {
  console.error(`[Email/Resend] ${context} — API error details:`);
  console.error(`  httpStatus=${status}`);
  console.error(`  name=${body?.name ?? "(none)"}`);
  console.error(`  message=${body?.message ?? "(none)"}`);
}

function mapResendHttpError(status: number, body: ResendErrorBody | null): never {
  logResendError("request failed", status, body);

  if (status === 401 || status === 403) {
    throw ApiError.internal(
      EMAIL_USER_MESSAGES.EMAIL_AUTH_FAILED,
      "EMAIL_AUTH_FAILED",
    );
  }

  throw ApiError.internal(EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED, "EMAIL_SEND_FAILED");
}

export function logResendSafeConfig(): void {
  const key = env.RESEND_API_KEY?.trim();
  console.log("[Email/Resend] Safe configuration:");
  console.log(`  RESEND_API_KEY=${key ? `${key.slice(0, 8)}…` : "(not set)"}`);
}

/** Validates API key by calling Resend domains endpoint (no email sent). */
export async function verifyResendProvider(): Promise<boolean> {
  logResendSafeConfig();

  if (!isResendConfigured) {
    console.error("[Email/Resend] verification result: FAILED (RESEND_API_KEY not set)");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      const body = (await res.json().catch(() => null)) as ResendErrorBody | null;
      logResendError("verification failed", res.status, body);
      console.error("[Email/Resend] verification result: FAILED (EMAIL_AUTH_FAILED)");
      return false;
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ResendErrorBody | null;
      logResendError("verification failed", res.status, body);
      console.error("[Email/Resend] verification result: FAILED");
      return false;
    }

    console.log("[Email/Resend] verification result: SUCCESS");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Email/Resend] verification result: FAILED — ${message}`);
    return false;
  }
}

export async function sendViaResend(payload: EmailPayload): Promise<void> {
  const from = resolveEmailFrom();

  console.log(`[Email/Resend] send started → ${payload.to} (${payload.subject})`);

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const body = (await res.json().catch(() => null)) as
      | (ResendErrorBody & { id?: string })
      | null;

    if (!res.ok) {
      mapResendHttpError(res.status, body);
    }

    console.log(
      `[Email/Resend] send succeeded → ${payload.to} (id=${body?.id ?? "ok"})`,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Email/Resend] send failed — ${message}`);
    throw ApiError.internal(EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED, "EMAIL_SEND_FAILED");
  }
}
