import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export function emailWrapper(content: string, footer?: string) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <tr>
      <td style="padding-bottom:32px; font-family: Inter, Arial, sans-serif;">
        <table cellpadding="0" cellspacing="0">
          <tr>

            <!-- SAN -->
            <td style="vertical-align:bottom;padding-bottom:3px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px;font-weight:600;letter-spacing:0.2em;color:#f0f0f0;line-height:1;">
                    SAN
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:2px;">
                    <table cellpadding="0" cellspacing="0" width="90%">
                      <tr>
                        <td height="3" style="background:#f0f0f0;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>

            <!-- CO -->
            <td style="vertical-align:bottom; padding-top:3px;">
              <table style="" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td height="3" style="background:#f0f0f0;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:3px;font-size:18px;font-weight:600;letter-spacing:0.2em;color:#f0f0f0;line-height:1;">
                    CO
                  </td>
                </tr>
              </table>
            </td>

            <!-- devs -->
            <td style="padding-left:6px;font-size:15px;color:#666666;font-weight:400;vertical-align:bottom;">
              devs
            </td>

          </tr>
        </table>
      </td>
    </tr>
        <!-- Card -->
        <tr><td style="background:#111111;border:0.5px solid #2a2a2a;border-radius:12px;padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">
            ${footer ?? "Sent from <a href='https://sancodevs.vercel.app' style='color:#666;text-decoration:none;'>sancodevs.vercel.app</a>"}
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#333;">
            © ${new Date().getFullYear()} SancoDevs
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    await transporter.sendMail({
        from: `"SancoDevs" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}