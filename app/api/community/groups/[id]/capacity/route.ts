import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: groupId } = await params;

    const group = await prisma.communityGroup.findUnique({
        where: { id: groupId },
        select: { id: true, maxMembers: true },
    });

    if (!group) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const activeCount = await prisma.communityMember.count({
        where: { groupId, status: "ACTIVE" },
    });

    const maxMembers = group.maxMembers ?? null;

    return NextResponse.json({
        activeCount,
        maxMembers,
        isFull: maxMembers !== null && activeCount >= maxMembers,
    });
}