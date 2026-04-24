import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const { targetUserId } = await req.json();

    // Verify requester is admin
    const adminMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!adminMember || adminMember.role !== "ADMIN" || adminMember.status !== "ACTIVE") {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // Cannot remove another admin
    const targetMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!targetMember) return NextResponse.json({ error: "Member not found." }, { status: 404 });
    if (targetMember.role === "ADMIN") {
        return NextResponse.json({ error: "Cannot remove another admin." }, { status: 403 });
    }

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    // Set status to LEFT (soft remove)
    await prisma.communityMember.update({
        where: { groupId_userId: { groupId, userId: targetUserId } },
        data: { status: "LEFT" },
    });

    // Notify removed user
    const notif = await prisma.notification.create({
        data: {
            userId: targetUserId,
            title: `Removed from "${group.name}"`,
            body: `You were removed from the group by an admin.`,
            href: `/community`,
        },
    });
    await pusher.trigger(`user-${targetUserId}`, "notification:new", notif);
    // Tell the removed user's client to move group to discover
    await pusher.trigger(`user-${targetUserId}`, "join:rejected", {
        groupId,
        groupName: group.name,
        isPrivate: group.isPrivate,
    });
    // Tell the group channel a member left
    await pusher.trigger(`group-${groupId}`, "member:left", {
        userId: targetUserId,
        userName: null,
    });

    return NextResponse.json({ success: true });
}