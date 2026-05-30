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

        const teams = await prisma.teamMember.findMany({
            where: { userId },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        tagline: true,
                        status: true,
                        domain: true,
                        projectType: true,
                        difficulty: true,
                        techStack: true,
                        phase: true,
                        coverImage: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
        });

        return NextResponse.json({
            projects: teams.map((t) => ({
                teamMemberId: t.id,
                role: t.role,
                permissionLevel: t.permissionLevel,
                joinedAt: t.joinedAt,
                active: t.active,
                contributionScore: t.contributionScore,
                project: {
                    id: t.project.id,
                    title: t.project.title,
                    tagline: t.project.tagline,
                    status: t.project.status,
                    domain: t.project.domain,
                    projectType: t.project.projectType,
                    difficulty: t.project.difficulty,
                    techStack: t.project.techStack,
                    phase: t.project.phase,
                    coverImage: t.project.coverImage,
                    createdAt: t.project.createdAt,
                },
            })),
        });
    } catch (err) {
        console.error("[user-projects]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}