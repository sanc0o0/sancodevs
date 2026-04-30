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

    const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    if (task.assignedTo) return NextResponse.json({ error: "Task already assigned." }, { status: 409 });

    // Check user is on the project team
    const member = await prisma.teamMember.findFirst({
        where: { projectId, userId: session.user.id },
    });
    if (!member) return NextResponse.json({ error: "Not a team member." }, { status: 403 });

    // Check user doesn't already have an active task
    const activeTask = await prisma.projectTask.findFirst({
        where: {
            projectId,
            assignedTo: session.user.id,
            status: { in: ["TODO", "IN_PROGRESS", "SUBMITTED"] },
        },
    });
    if (activeTask) return NextResponse.json({
        error: "You already have an active task on this project. Complete it first.",
    }, { status: 409 });

    // Check no existing pending request for this task
    const existing = await prisma.taskAssignmentRequest.findUnique({
        where: { taskId_userId: { taskId, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Request already sent." }, { status: 409 });

    await prisma.taskAssignmentRequest.create({
        data: { taskId, userId: session.user.id },
    });

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true, title: true },
    });

    if (project) {
        await prisma.notification.create({
            data: {
                userId: project.createdBy,
                title: "Task assignment request",
                body: `${session.user.name ?? "A member"} wants to work on "${task.title}".`,
                href: `/projects/${projectId}/board`,
            },
        });
    }

    return NextResponse.json({ status: "PENDING" });
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    await prisma.taskAssignmentRequest.deleteMany({
        where: { taskId, userId: session.user.id },
    }).catch(() => { });

    return NextResponse.json({ success: true });
}