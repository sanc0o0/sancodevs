import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;

    const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        include: {
            assignee: { select: { id: true, name: true, image: true } },
            milestone: { select: { id: true, title: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;
    const { title, description, assignedTo, milestoneId, priority, dueDate } = await req.json();

    if (!title) return NextResponse.json({ error: "Title required." }, { status: 400 });

    // Verify user is on the team
    const member = await prisma.teamMember.findFirst({
        where: { projectId, userId: session.user.id },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!member && project?.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Not on this project." }, { status: 403 });
    }

    const task = await prisma.projectTask.create({
        data: {
            projectId, title,
            description: description || null,
            assignedTo: assignedTo || null,
            milestoneId: milestoneId || null,
            priority: priority || "MEDIUM",
            dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
            assignee: { select: { id: true, name: true, image: true } },
        },
    });

    // Notify assignee
    if (assignedTo && assignedTo !== session.user.id) {
        await prisma.notification.create({
            data: {
                userId: assignedTo,
                title: "New task assigned",
                body: `"${title}" was assigned to you on ${project?.title}.`,
                href: `/projects/${projectId}`,
            },
        });
    }

    return NextResponse.json(task, { status: 201 });
}