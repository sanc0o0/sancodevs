import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

    // ← FETCH the group first
    const group = await prisma.communityGroup.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, isPrivate: true },
    });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Not an active member." }, { status: 404 });
    }

    if (member.role === "ADMIN") {
        const otherAdmins = await prisma.communityMember.count({
            where: { groupId, role: "ADMIN", status: "ACTIVE", userId: { not: session.user.id } },
        });
        if (otherAdmins === 0) {
            return NextResponse.json({
                error: "You're the only admin. Transfer ownership before leaving.",
            }, { status: 400 });
        }
    }

    await prisma.communityMember.update({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        data: { status: "LEFT" },
    });

    // Tell the leaving user's client to move group to discover if public
    await pusher.trigger(`user-${session.user.id}`, "join:rejected", {
        groupId,
        groupName: group.name,
        isPrivate: group.isPrivate,
    });

    // Notify group channel
    await pusher.trigger(`group-${groupId}`, "member:left", {
        userId: session.user.id,
        userName: session.user.name,
    });

    return NextResponse.json({ success: true });
}