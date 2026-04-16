import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skills, goal, pathId, readinessScore, userCategory } = await req.json();

    const existing = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (existing) {
        // Allow re-onboarding by updating
        await prisma.userOnboarding.update({
            where: { userId: session.user.id },
            data: { skills, goal, pathId, readinessScore, userCategory },
        });
        return NextResponse.json({ success: true });
    }

    await prisma.userOnboarding.create({
        data: {
            userId: session.user.id,
            skills,
            goal,
            pathId,
            readinessScore: readinessScore ?? 0,
            userCategory: userCategory ?? "BEGINNER",
        },
    });

    return NextResponse.json({ success: true });
}