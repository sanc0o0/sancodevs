import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;

    // Verify requester is admin
    const adminMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!adminMember || adminMember.role !== "ADMIN" || adminMember.status !== "ACTIVE") {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const group = await prisma.communityGroup.findUnique({
        where: { id: groupId },
        include: {
            members: {
                where: { status: "ACTIVE" },
                select: { userId: true },
            },
        },
    });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    // Notify all active members BEFORE deleting
    for (const member of group.members) {
        if (member.userId === session.user.id) continue;
        const notif = await prisma.notification.create({
            data: {
                userId: member.userId,
                title: `"${group.name}" was deleted`,
                body: `The group "${group.name}" has been permanently deleted by the admin.`,
                href: `/community`,
            },
        });
        await pusher.trigger(`user-${member.userId}`, "notification:new", notif);
        // Tell each member's client to remove the group
        await pusher.trigger(`user-${member.userId}`, "group:deleted", {
            groupId,
            groupName: group.name,
        });
    }

    // Notify the group channel itself
    await pusher.trigger(`group-${groupId}`, "group:deleted", {
        groupId,
        groupName: group.name,
        deletedBy: session.user.name,
    });

    // Delete in dependency order
    await prisma.messageReaction.deleteMany({ where: { message: { groupId } } });
    await prisma.messageReceipt.deleteMany({ where: { message: { groupId } } });
    await prisma.communityMessage.deleteMany({ where: { groupId } });
    await prisma.communityMember.deleteMany({ where: { groupId } });
    // If linked to a project, unlink first
    await prisma.project.updateMany({
        where: { communityGroupId: groupId },
        data: { communityGroupId: null },
    });
    await prisma.communityGroup.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
}