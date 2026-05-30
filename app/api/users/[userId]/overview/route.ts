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

        // Block check — server enforced
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewer.id, blockedId: userId },
                    { blockerId: userId, blockedId: viewer.id },
                ],
            },
        });
        if (block) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const isOwner = viewer.id === userId;

        // ── Lightweight parallel fetches ──────────────────────────────────────────
        const [stats, recentProjects, activeTasks, reliabilityEvents] = await Promise.all([
            // Stats summary
            prisma.userStats.findUnique({
                where: { userId },
                select: {
                    tasksCompleted: true,
                    tasksMissed: true,
                    tasksLate: true,
                    reliabilityScore: true,
                    projectsCompleted: true,
                    onTimeRate: true,
                },
            }),

            // Recent 3 team memberships
            prisma.teamMember.findMany({
                where: { userId, active: true },
                include: {
                    project: {
                        select: { id: true, title: true, status: true, domain: true },
                    },
                },
                orderBy: { joinedAt: "desc" },
                take: 3,
            }),

            // Active tasks (owner only)
            isOwner
                ? prisma.projectTask.findMany({
                    where: {
                        assignedTo: userId,
                        status: { in: ["TODO", "IN_PROGRESS"] },
                    },
                    include: {
                        project: { select: { id: true, title: true } },
                    },
                    orderBy: { dueDate: "asc" },
                    take: 3,
                })
                : Promise.resolve([]),

            // Recent 3 reliability events (public only for non-owners)
            prisma.reliabilityEvent.findMany({
                where: {
                    userId,
                    ...(isOwner ? {} : { isPublic: true }),
                },
                orderBy: { occurredAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    eventType: true,
                    scoreDelta: true,
                    taskTitle: true,
                    projectLabel: true,
                    occurredAt: true,
                },
            }),
        ]);

        return NextResponse.json({
            stats: stats
                ? {
                    tasksCompleted: stats.tasksCompleted,
                    tasksMissed: stats.tasksMissed,
                    tasksLate: stats.tasksLate,
                    reliabilityScore: stats.reliabilityScore,
                    projectsCompleted: stats.projectsCompleted,
                    onTimeRate: stats.onTimeRate,
                }
                : null,

            recentProjects: recentProjects.map((t) => ({
                id: t.project.id,
                title: t.project.title,
                status: t.project.status,
                domain: t.project.domain,
                role: t.role,
            })),

            activeTasks: activeTasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                projectId: t.project.id,
                projectTitle: t.project.title,
            })),

            recentReliabilityEvents: reliabilityEvents.map((e) => ({
                id: e.id,
                eventType: e.eventType,
                scoreDelta: e.scoreDelta,
                taskTitle: e.taskTitle,
                projectLabel: e.projectLabel,
                occurredAt: e.occurredAt,
            })),

            isOwner,
        });
    } catch (err) {
        console.error("[overview]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}