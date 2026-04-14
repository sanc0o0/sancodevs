import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailWrapper } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "All fields required." }, { status: 400 });
        }

        await prisma.contactMessage.create({
            data: { name, email, message },
        });

        await sendEmail({
            to: process.env.EMAIL_USER!,
            subject: `New contact message from ${name}`,
            html: emailWrapper(`
                <h2 style="margin:0 0 20px;font-size:18px;font-weight:500;color:#f0f0f0;">New contact message</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:8px 0;color:#666;font-size:13px;width:80px;border-bottom:0.5px solid #2a2a2a;">Name</td><td style="padding:8px 0;font-size:13px;color:#f0f0f0;border-bottom:0.5px solid #2a2a2a;">${name}</td></tr>
                    <tr><td style="padding:8px 0;color:#666;font-size:13px;border-bottom:0.5px solid #2a2a2a;">Email</td><td style="padding:8px 0;font-size:13px;border-bottom:0.5px solid #2a2a2a;"><a href="mailto:${email}" style="color:#f0f0f0;text-decoration:none;">${email}</a></td></tr>
                </table>
                <div style="background:#1a1a1a;border:0.5px solid #2a2a2a;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 6px;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
                    <p style="margin:0;font-size:13px;color:#ccc;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
                </div>
            `),
        });

        await sendEmail({
            to: email,
            subject: "We got your message — SancoDevs",
            html: emailWrapper(`
                <h2 style="margin:0 0 12px;font-size:18px;font-weight:500;color:#f0f0f0;">Hey ${name},</h2>
                <p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.7;">We received your message and will get back to you within a day or two.</p>
                <div style="background:#1a1a1a;border:0.5px solid #2a2a2a;border-radius:8px;padding:16px;margin-bottom:24px;">
                    <p style="margin:0 0 6px;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:0.06em;">Your message</p>
                    <p style="margin:0;font-size:13px;color:#ccc;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
                </div>
                <a href="https://sancodevs.vercel.app" style="display:inline-block;padding:10px 20px;background:#f0f0f0;color:#0a0a0a;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;">Visit SancoDevs</a>
            `, "You're receiving this because you contacted us via sancodevs.vercel.app"),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }
}