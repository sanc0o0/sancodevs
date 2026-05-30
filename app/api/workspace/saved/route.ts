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

    const saved = await prisma.savedProject.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            savedAt: true,
            project: {
                select: {
                    id: true,
                    title: true,
                    tagline: true,
                    domain: true,
                    phase: true,
                    status: true,
                    difficulty: true,
                    hiringOpen: true,
                    techStack: true,
                    _count: { select: { teams: { where: { active: true } } } },
                },
            },
        },
        orderBy: { savedAt: "desc" },
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = saved.length > take;
    const data = hasMore ? saved.slice(0, take) : saved;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor });
}