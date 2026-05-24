import { emailLayout } from "./base.js";

export function otpVerificationEmail(params: {
  firstName: string;
  otp: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `${params.otp} — Cognitiax AI verification code`;

  const content = `
    <p style="margin:0 0 16px;font-size:15px;">Hi <strong>${escapeHtml(params.firstName)}</strong>,</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Welcome to <strong>Cognitiax AI</strong>. Enter this verification code to complete your student registration:
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;padding:4px;border-radius:14px;background:linear-gradient(135deg,#c5a028,#004d3d);">
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:0.4em;padding:18px 32px;background:#ffffff;color:#002e1a;border-radius:12px;font-family:'Courier New',monospace;">
          ${params.otp}
        </span>
      </div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#ecfdf5;border-radius:10px;border:1px solid #a7f3d0;">
      <tr>
        <td style="padding:14px 18px;font-size:14px;color:#065f46;font-family:system-ui,sans-serif;">
          ⏱ This code expires in <strong>${params.expiresMinutes} minutes</strong>. Do not share it with anyone.
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      If you didn't create a Cognitiax AI account, you can safely ignore this email.
    </p>
  `;

  const text = [
    `Hi ${params.firstName},`,
    ``,
    `Your Cognitiax AI verification code is: ${params.otp}`,
    ``,
    `This code expires in ${params.expiresMinutes} minutes.`,
    ``,
    `If you didn't request this, ignore this email.`,
  ].join("\n");

  return { subject, html: emailLayout(content), text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
