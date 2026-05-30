import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = 20;

    const memberships = await prisma.teamMember.findMany({
        where: {
            userId: session.user.id,
            active: true,
            project: {
                createdBy: { not: session.user.id },
                status: { not: "ARCHIVED" },
            },
        },
        select: {
            id: true,
            role: true,
            permissionLevel: true,
            joinedAt: true,
            project: {
                select: {
                    id: true,
                    title: true,
                    tagline: true,
                    phase: true,
                    status: true,
                    domain: true,
                    updatedAt: true,
                    _count: { select: { tasks: { where: { assignedTo: session.user.id } } } },
                },
            },
        },
        orderBy: { joinedAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = memberships.length > take;
    const data = hasMore ? memberships.slice(0, take) : memberships;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor });
}