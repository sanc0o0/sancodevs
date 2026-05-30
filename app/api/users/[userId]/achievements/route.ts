import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const viewer = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId } = await params;

        // Block check
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewer.id, blockedId: userId },
                    { blockerId: userId, blockedId: viewer.id },
                ],
            },
        });
        if (block) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Fetch earned achievements — select only public-safe fields
        const earned = await prisma.userAchievement.findMany({
            where: { userId },
            select: {
                id: true,
                achievementKey: true,
                earnedAt: true,
                sharedCount: true,
            },
            orderBy: { earnedAt: "desc" },
        });

        return NextResponse.json({
            earned: earned.map((a) => ({
                id: a.id,
                achievementKey: a.achievementKey,
                earnedAt: a.earnedAt.toISOString(),
                sharedCount: a.sharedCount,
            })),
            earnedCount: earned.length,
            total: earned.length,
        });
    } catch (err) {
        console.error("[achievements]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}