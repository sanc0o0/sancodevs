import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mission, domain, role, experienceLevel, availability, goals, collaborationReady } =
        await req.json();

    // Basic validation
    if (!mission || !domain || !role || !experienceLevel || !availability) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Derive a simple builderScore from experience + availability
    const expScore: Record<string, number> = { BEGINNER: 20, INTERMEDIATE: 50, ADVANCED: 80 };
    const availScore: Record<string, number> = { WEEKEND: 10, LIGHT: 20, MODERATE: 35, FULLTIME: 50 };
    const builderScore = Math.min(100, (expScore[experienceLevel] ?? 20) + (availScore[availability] ?? 10));

    await prisma.userOnboarding.upsert({
        where: { userId: session.user.id },
        update: {
            mission,
            domain,
            role,
            experienceLevel,
            availability,
            goals: goals ?? [],
            collaborationReady: collaborationReady ?? true,
            builderScore,
        },
        create: {
            userId: session.user.id,
            mission,
            domain,
            role,
            experienceLevel,
            availability,
            goals: goals ?? [],
            collaborationReady: collaborationReady ?? true,
            builderScore,
        },
    });

    return NextResponse.json({ success: true });
}