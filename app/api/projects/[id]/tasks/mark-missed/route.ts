import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUserStats } from "@/lib/scoring";

// Called on board page load — marks overdue unsubmitted tasks as MISSED
// 1hr grace period on the deadline before marking
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;

    const overdue = await prisma.projectTask.findMany({
        where: {
            projectId,
            status: { in: ["TODO", "IN_PROGRESS"] },
            dueDate: { lt: new Date(Date.now() - 60 * 60 * 1000) }, // 1hr grace
        },
        select: { id: true, assignedTo: true, title: true },
    });

    if (overdue.length === 0) return NextResponse.json({ marked: 0 });

    // Mark all overdue as MISSED
    await prisma.projectTask.updateMany({
        where: { id: { in: overdue.map(t => t.id) } },
        data: { status: "MISSED" },
    });

    // Recalculate stats + notify each affected assignee
    const assigneeIds = [...new Set(
        overdue.map(t => t.assignedTo).filter(Boolean)
    )] as string[];

    await Promise.all(assigneeIds.map(async (userId) => {
        // Recalculate using shared scoring service
        await updateUserStats(userId);

        // Notify
        const missedForUser = overdue.filter(t => t.assignedTo === userId);
        await prisma.notification.create({
            data: {
                userId,
                title: "Deadline missed",
                body: missedForUser.length === 1
                    ? `"${missedForUser[0].title}" was marked as missed — deadline passed.`
                    : `${missedForUser.length} tasks were marked as missed.`,
                href: `/projects/${projectId}/board`,
            },
        });
    }));

    return NextResponse.json({ marked: overdue.length });
}