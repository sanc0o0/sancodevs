import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use." }, { status: 409 });
        }

        const hashed = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: { name, email, password: hashed },
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}