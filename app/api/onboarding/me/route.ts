import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ onboarding: null });

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (!onboarding) return NextResponse.json({ onboarding: null });

    return NextResponse.json({
        onboarding: {
            mission: onboarding.mission,
            domain: onboarding.domain,
            role: onboarding.role,
            experienceLevel: onboarding.experienceLevel,
            availability: onboarding.availability,
            goals: onboarding.goals,
            builderScore: onboarding.builderScore,
        },
    });
}