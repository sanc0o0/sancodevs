import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId, taskId } = await params;
    const { requestUserId, action } = await req.json();

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true, title: true },
    });
    if (project?.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Owner only." }, { status: 403 });
    }

    if (action === "approve") {
        await prisma.projectTask.update({
            where: { id: taskId },
            data: { assignedTo: requestUserId, status: "TODO" },
        });
        await prisma.taskAssignmentRequest.deleteMany({ where: { taskId } });

        await prisma.notification.create({
            data: {
                userId: requestUserId,
                title: "Task assigned to you",
                body: `You've been assigned to a task on "${project.title}".`,
                href: `/projects/${projectId}/board`,
            },
        });
    } else {
        await prisma.taskAssignmentRequest.deleteMany({
            where: { taskId, userId: requestUserId },
        });
        await prisma.notification.create({
            data: {
                userId: requestUserId,
                title: "Assignment request declined",
                body: `Your request for a task on "${project.title}" was not approved.`,
                href: `/projects/${projectId}/board`,
            },
        });
    }

    return NextResponse.json({ success: true });
}