import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;

    const [
        totalProjects,
        activeGroups,
        tasksCompleted,
        totalTasks,
        friendCount,
    ] = await Promise.all([
        prisma.teamMember.count({ where: { userId } }),
        prisma.communityMember.count({ where: { userId, status: "ACTIVE" } }),
        prisma.projectTask.count({ where: { assignedTo: userId, status: "DONE" } }),
        prisma.projectTask.count({ where: { assignedTo: userId } }),
        prisma.friendship.count({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        }),
    ]);

    const completionRate = totalTasks > 0
        ? Math.round((tasksCompleted / totalTasks) * 100)
        : 0;

    return NextResponse.json({
        totalProjects,
        activeGroups,
        tasksCompleted,
        totalTasks,
        completionRate,
        friendCount,
    });
}