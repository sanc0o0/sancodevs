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

        // Server-side ownership enforcement — never trust client
        if (viewer.id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = new URL(req.url);
        const statusFilter = url.searchParams.get("status"); // optional filter

        const tasks = await prisma.projectTask.findMany({
            where: {
                assignedTo: userId,
                ...(statusFilter
                    ? { status: statusFilter }
                    : { status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } }),
            },
            include: {
                project: {
                    select: { id: true, title: true, status: true },
                },
                milestone: {
                    select: { id: true, title: true },
                },
            },
            orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        });

        return NextResponse.json({
            tasks: tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                category: t.category,
                dueDate: t.dueDate,
                estimatedHours: t.estimatedHours,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                project: {
                    id: t.project.id,
                    title: t.project.title,
                    status: t.project.status,
                },
                milestone: t.milestone
                    ? { id: t.milestone.id, title: t.milestone.title }
                    : null,
            })),
        });
    } catch (err) {
        console.error("[user-tasks]", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}