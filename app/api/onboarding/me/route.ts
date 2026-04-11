import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { PATHS } from "@/lib/path";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ label: null });

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (!onboarding) return NextResponse.json({ label: null });

    const path = PATHS[onboarding.pathId];
    return NextResponse.json({ label: path?.label ?? null, pathId: onboarding.pathId });
}