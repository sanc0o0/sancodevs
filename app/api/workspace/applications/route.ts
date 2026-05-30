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
    const take = 20;

    const applications = await prisma.projectApplication.findMany({
        where: {
            userId: session.user.id,
            ...(statusFilter ? { status: statusFilter } : {}),
        },
        select: {
            id: true,
            status: true,
            desiredRole: true,
            createdAt: true,
            reviewedAt: true,
            project: {
                select: {
                    id: true,
                    title: true,
                    domain: true,
                    phase: true,
                    status: true,
                    coverImage: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = applications.length > take;
    const data = hasMore ? applications.slice(0, take) : applications;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor });
}