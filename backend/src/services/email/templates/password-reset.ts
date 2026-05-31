import { emailLayout } from "./base.js";

export function passwordResetEmail(params: {
  otp: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `${params.otp} — Reset your CognitiaX AI password`;

  const content = `
    <p style="margin:0 0 16px;font-size:15px;">Hello,</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      We received a request to reset your <strong>CognitiaX AI</strong> password. Use the code below to continue:
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;padding:4px;border-radius:14px;background:linear-gradient(135deg,#008037,#004d3d);">
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:0.4em;padding:18px 32px;background:#ffffff;color:#004d3d;border-radius:12px;font-family:'Courier New',monospace;">
          ${params.otp}
        </span>
      </div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">
      <tr>
        <td style="padding:14px 18px;font-size:14px;color:#92400e;font-family:system-ui,sans-serif;">
          ⏱ Expires in <strong>${params.expiresMinutes} minutes</strong>. If you didn't request a reset, ignore this email — your password stays the same.
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      For security, never share this code. CognitiaX AI will never ask for it by phone or chat.
    </p>
  `;

  const text = [
    `Your CognitiaX AI password reset code is: ${params.otp}`,
    ``,
    `Expires in ${params.expiresMinutes} minutes.`,
    ``,
    `If you didn't request this, ignore this email.`,
  ].join("\n");

  return { subject, html: emailLayout(content), text };
}
