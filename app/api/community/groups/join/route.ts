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

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    const existing = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });

    if (existing?.status === "ACTIVE") {
        return NextResponse.json({ error: "Already a member.", status: "ACTIVE" }, { status: 409 });
    }
    if (existing?.status === "PENDING") {
        return NextResponse.json({ error: "Request already pending.", status: "PENDING" }, { status: 409 });
    }

    // STRICT: ALL groups require approval — no auto-join ever
    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        update: { status: "PENDING" },
        create: {
            groupId,
            userId: session.user.id,
            status: "PENDING",
            role: "MEMBER",
        },
    });

    // Notify ALL admins of this group
    const admins = await prisma.communityMember.findMany({
        where: { groupId, role: "ADMIN", status: "ACTIVE" },
        select: { userId: true },
    });

    for (const admin of admins) {
        const notif = await prisma.notification.create({
            data: {
                userId: admin.userId,
                title: `Join request — ${group.name}`,
                body: `${session.user.name ?? "Someone"} wants to join your group.`,
                href: `/community`,
            },
        });
        // Real-time notification to admin
        await pusher.trigger(`user-${admin.userId}`, "notification:new", notif);
        await pusher.trigger(`user-${admin.userId}`, "join:request:new", {
            groupId,
            groupName: group.name,
            userId: session.user.id,
            userName: session.user.name,
            userImage: session.user.image,
        });
    }

    return NextResponse.json({ status: "PENDING" });
}