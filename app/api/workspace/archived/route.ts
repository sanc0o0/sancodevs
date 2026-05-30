import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    const [archivedCreated, archivedJoined] = await Promise.all([
        prisma.project.findMany({
            where: { createdBy: userId, status: "ARCHIVED" },
            select: {
                id: true,
                title: true,
                tagline: true,
                phase: true,
                domain: true,
                updatedAt: true,
                _count: { select: { teams: { where: { active: true } } } },
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
        }),
        prisma.teamMember.findMany({
            where: {
                userId,
                project: { status: "ARCHIVED", createdBy: { not: userId } },
            },
            select: {
                id: true,
                role: true,
                joinedAt: true,
                project: {
                    select: {
                        id: true,
                        title: true,
                        tagline: true,
                        domain: true,
                        updatedAt: true,
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
            take: 20,
        }),
    ]);

    return NextResponse.json({ archivedCreated, archivedJoined });
}