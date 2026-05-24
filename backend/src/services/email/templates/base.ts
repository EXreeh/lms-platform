export function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cognitiax AI</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,77,61,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#c5a028 0%,#004d3d 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.05em;">COGNITIAX AI</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:system-ui,sans-serif;">AI-Powered Learning Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,sans-serif;color:#0f1f1a;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#051c17;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;font-family:system-ui,sans-serif;">
                © ${new Date().getFullYear()} Cognitiax AI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
