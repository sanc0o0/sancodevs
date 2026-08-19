import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const baseUrl = process.env.NEXTAUTH_URL;

    if (!token || !email) {
        return NextResponse.redirect(`${baseUrl}/verify-email?status=invalid`);
    }

    const record = await prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier: email, token } },
    });

    if (!record || record.expires < new Date()) {
        return NextResponse.redirect(
            `${baseUrl}/verify-email?status=expired&email=${encodeURIComponent(email)}`
        );
    }

    await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
    });

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
}