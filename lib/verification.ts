import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailWrapper } from "@/lib/email";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function createVerificationToken(email: string) {
    // Invalidate any previous unused tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
    });

    return token;
}

export async function sendVerificationEmail(email: string, name?: string | null) {
    const token = await createVerificationToken(email);
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    const content = `
        <h2 style="margin:0 0 12px;color:#f0f0f0;font-size:18px;font-weight:600;">Verify your email</h2>
        <p style="margin:0 0 20px;color:#999;font-size:14px;line-height:1.6;">
            Hi ${name || "there"}, confirm this is your email address to activate your SancoDevs account.
            This link expires in 24 hours.
        </p>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <td style="border-radius:8px;background:#f0f0f0;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:500;color:#0a0a0a;text-decoration:none;">
                        Verify email
                    </a>
                </td>
            </tr>
        </table>
        <p style="margin:20px 0 0;color:#555;font-size:12px;">
            Or paste this link into your browser:<br/>
            <span style="color:#777;word-break:break-all;">${verifyUrl}</span>
        </p>
    `;

    await sendEmail({
        to: email,
        subject: "Verify your SancoDevs email",
        html: emailWrapper(content),
    });
}