import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const statusFilter = searchParams.get("status") ?? undefined;
    const take = 30;

    const tasks = await prisma.projectTask.findMany({
        where: {
            assignedTo: session.user.id,
            ...(statusFilter ? { status: statusFilter } : {}),
        },
        select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: true,
            dueDate: true,
            estimatedHours: true,
            updatedAt: true,
            project: { select: { id: true, title: true } },
            milestone: { select: { id: true, title: true } },
        },
        orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
            { priority: "asc" },
        ],
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = tasks.length > take;
    const data = hasMore ? tasks.slice(0, take) : tasks;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor });
}