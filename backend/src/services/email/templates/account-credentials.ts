import { emailLayout } from "./base.js";

export function accountCredentialsEmail(params: {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  roleLabel: string;
}): { subject: string; html: string; text: string } {
  const subject = "Your CognitiaX AI institute portal login";

  const content = `
    <p style="margin:0 0 16px;font-size:15px;">Hi <strong>${escapeHtml(params.firstName)}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
      Your <strong>${escapeHtml(params.roleLabel)}</strong> account for the CognitiaX AI institute portal has been created.
      Use the credentials below to sign in:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:16px 18px;font-size:14px;color:#111827;font-family:system-ui,sans-serif;line-height:1.8;">
          <strong>Login URL:</strong> <a href="${params.loginUrl}" style="color:#004d3d;">${escapeHtml(params.loginUrl)}</a><br/>
          <strong>Email:</strong> ${escapeHtml(params.email)}<br/>
          <strong>Temporary password:</strong> <code style="background:#ecfdf5;padding:2px 6px;border-radius:4px;">${escapeHtml(params.temporaryPassword)}</code>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
      Please change your password after your first login. If you did not expect this email, contact your institute administrator.
    </p>
  `;

  const text = [
    `Hi ${params.firstName},`,
    ``,
    `Your ${params.roleLabel} account for CognitiaX AI has been created.`,
    ``,
    `Login URL: ${params.loginUrl}`,
    `Email: ${params.email}`,
    `Temporary password: ${params.temporaryPassword}`,
    ``,
    `Please change your password after your first login.`,
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
