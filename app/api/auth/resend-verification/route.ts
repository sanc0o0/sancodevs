import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/verification";

const RESEND_COOLDOWN_MS = 60 * 1000;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Same response whether or not the account exists, so this can't
        // be used to enumerate which emails are registered.
        if (user && !user.emailVerified) {
            const existingToken = await prisma.verificationToken.findFirst({
                where: { identifier: email },
            });

            if (existingToken) {
                const issuedAt = existingToken.expires.getTime() - TOKEN_TTL_MS;
                if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) {
                    return NextResponse.json(
                        { error: "A verification email was just sent. Check your inbox." },
                        { status: 429 }
                    );
                }
            }

            await sendVerificationEmail(email, user.name);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}