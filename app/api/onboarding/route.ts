import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skills, goal, pathId } = await req.json();

    const existing = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (existing) {
        return NextResponse.json({ error: "Already onboarded" }, { status: 409 });
    }

    await prisma.userOnboarding.create({
        data: { userId: session.user.id, skills, goal, pathId },
    });

    return NextResponse.json({ success: true });
}