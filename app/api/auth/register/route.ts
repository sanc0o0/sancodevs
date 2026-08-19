import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueUsername } from "@/lib/username";
import { sendVerificationEmail } from "@/lib/verification";
import { validatePassword } from "@/lib/password";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();
        const passwordError = validatePassword(password);

        if (!name || !email || !password) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        if (passwordError) {
            return NextResponse.json({ error: passwordError}, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use." }, { status: 409 });
        }

        const hashed = await bcrypt.hash(password, 12);

        const username = await generateUniqueUsername(email);

        await prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashed,
                accounts: {
                    create: {
                        type: "credentials",
                        provider: "credentials",
                        providerAccountId: email,
                    },
                },
            },
          });

        // Account stays unverified (and therefore blocked from credentials
        // login) until this link is clicked.
        await sendVerificationEmail(email, name);
        return NextResponse.json({ success: true }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}