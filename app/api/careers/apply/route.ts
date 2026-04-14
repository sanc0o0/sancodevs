import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, role, experience, why, github, portfolio, agreed } = body;

        if (!name || !email || !role || !experience || !why || !agreed) {
            return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
        }

        await prisma.jobApplication.create({
            data: { name, email, role, experience, why, github: github || null, portfolio: portfolio || null, agreed },
        });

        await sendEmail({
            to: process.env.EMAIL_USER!,
            subject: `New job application: ${role} — ${name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0a0a0a;">New application for: ${role}</h2>
                    <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px 0; color: #666; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 500;">${name}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Role</td><td style="padding: 8px 0;">${role}</td></tr>
                        <tr><td style="padding: 8px 0; color: #666;">Experience</td><td style="padding: 8px 0;">${experience}</td></tr>
                        ${github ? `<tr><td style="padding: 8px 0; color: #666;">GitHub</td><td style="padding: 8px 0;"><a href="${github}">${github}</a></td></tr>` : ""}
                        ${portfolio ? `<tr><td style="padding: 8px 0; color: #666;">Portfolio</td><td style="padding: 8px 0;"><a href="${portfolio}">${portfolio}</a></td></tr>` : ""}
                    </table>
                    <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
                        <p style="margin: 0 0 6px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Why they want to join</p>
                        <p style="margin: 0; color: #333; line-height: 1.7;">${why.replace(/\n/g, "<br>")}</p>
                    </div>
                    <p style="margin-top: 16px; color: #999; font-size: 12px;">Applied via sancodevs.vercel.app/careers/apply</p>
                </div>
            `,
        });

        await sendEmail({
            to: email,
            subject: `Application received — SancoDevs`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0a0a0a;">Thank you for applying, ${name}.</h2>
                    <p style="color: #666; line-height: 1.7;">We've received your application for <strong>${role}</strong> at SancoDevs.</p>
                    <p style="color: #666; line-height: 1.7;">We review every application carefully and will be in touch if there's a strong fit. This usually takes up to a week.</p>
                    <p style="color: #666; line-height: 1.7;">In the meantime, feel free to explore SancoDevs and start building your skills.</p>
                    <div style="margin-top: 24px;">
                        <a href="https://sancodevs.vercel.app" style="display: inline-block; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px;">Explore SancoDevs</a>
                    </div>
                    <p style="margin-top: 24px; color: #999; font-size: 12px;">— The SancoDevs team · sanansari0305@gmail.com</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
    }
}