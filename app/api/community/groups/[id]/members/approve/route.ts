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
    const { targetUserId, action } = await req.json();

    if (!targetUserId || !["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Verify requester is admin
    const adminMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!adminMember || adminMember.role !== "ADMIN" || adminMember.status !== "ACTIVE") {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    const targetMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!targetMember || targetMember.status !== "PENDING") {
        return NextResponse.json({ error: "No pending request found." }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true },
    });

    if (action === "approve") {
        await prisma.communityMember.update({
            where: { groupId_userId: { groupId, userId: targetUserId } },
            data: { status: "ACTIVE" },
        });

        const notif = await prisma.notification.create({
            data: {
                userId: targetUserId,
                title: `You're in — ${group.name}`,
                body: `Your request to join "${group.name}" was approved.`,
                href: `/community?groupId=${groupId}`,
            },
        });
        await pusher.trigger(`user-${targetUserId}`, "notification:new", notif);
        await pusher.trigger(`user-${targetUserId}`, "join:accepted", { groupId, groupName: group.name });
        await pusher.trigger(`group-${groupId}`, "member:joined", {
            userId: targetUserId,
            userName: targetUser?.name,
        });

    } else {
        await prisma.communityMember.update({
            where: { groupId_userId: { groupId, userId: targetUserId } },
            data: { status: "REJECTED" },
        });

        const notif = await prisma.notification.create({
            data: {
                userId: targetUserId,
                title: `Request declined — ${group.name}`,
                body: `Your request to join "${group.name}" was not approved.`,
                href: `/community?tab=requests`,
            },
        });
        await pusher.trigger(`user-${targetUserId}`, "notification:new", notif);
        await pusher.trigger(`user-${targetUserId}`, "join:rejected", { groupId, groupName: group.name });
    }

    return NextResponse.json({ success: true, action });
}