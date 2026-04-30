import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called on board page load — marks overdue unsubmitted tasks as MISSED
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;

    const overdue = await prisma.projectTask.findMany({
        where: {
            projectId,
            status: { in: ["TODO", "IN_PROGRESS"] },
            dueDate: { lt: new Date(Date.now() - 60 * 60 * 1000) },
        },
        select: { id: true, assignedTo: true, title: true },
    });

    if (overdue.length === 0) return NextResponse.json({ marked: 0 });

    await prisma.projectTask.updateMany({
        where: { id: { in: overdue.map(t => t.id) } },
        data: { status: "MISSED" },
    });

    // Update stats for all affected assignees
    const assigneeIds = [...new Set(overdue.map(t => t.assignedTo).filter(Boolean))] as string[];
    for (const userId of assigneeIds) {
        const allTasks = await prisma.projectTask.findMany({
            where: { assignedTo: userId, status: { in: ["DONE", "LATE", "MISSED", "REJECTED"] } },
        });
        const completed = allTasks.filter(t => t.status === "DONE").length;
        const late = allTasks.filter(t => t.status === "LATE").length;
        const missed = allTasks.filter(t => t.status === "MISSED").length;
        const rejected = allTasks.filter(t => t.status === "REJECTED").length;
        const total = completed + late + missed + rejected;
        const onTimeRate = total > 0 ? Math.round((completed / total) * 100) : 100;
        const reliabilityScore = total > 0 ? Math.round(((completed + late * 0.5) / total) * 100) : 100;

        await prisma.userStats.upsert({
            where: { userId },
            update: { tasksMissed: missed, tasksCompleted: completed, tasksLate: late, tasksRejected: rejected, onTimeRate, reliabilityScore },
            create: { userId, tasksMissed: missed, tasksCompleted: completed, tasksLate: late, tasksRejected: rejected, onTimeRate, reliabilityScore },
        });

        // Notify assignee
        const missedTasks = overdue.filter(t => t.assignedTo === userId);
        if (missedTasks.length > 0) {
            await prisma.notification.create({
                data: {
                    userId,
                    title: "Task deadline missed",
                    body: missedTasks.length === 1
                        ? `"${missedTasks[0].title}" was marked as missed.`
                        : `${missedTasks.length} tasks were marked as missed.`,
                    href: `/projects/${projectId}/board`,
                },
            });
        }
    }

    return NextResponse.json({ marked: overdue.length });
}