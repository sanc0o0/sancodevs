import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const body = await req.json();

    const task = await prisma.projectTask.update({
        where: { id: taskId },
        data: {
            ...(body.status && { status: body.status }),
            ...(body.title && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
            ...(body.priority && { priority: body.priority }),
            ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        },
        include: { assignee: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(task);
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    await prisma.projectTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
}