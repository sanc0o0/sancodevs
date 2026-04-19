import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ ALWAYS verify user exists before any FK operation
    const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, image: true },
    });
    if (!userExists) {
        return NextResponse.json({
            error: "User not found. Please sign out and sign back in.",
        }, { status: 404 });
    }

    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "groupId required." }, { status: 400 });

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    if (group.isPrivate) {
        return NextResponse.json({
            error: "This group is private. You can only join by invitation.",
        }, { status: 403 });
    }

    const existing = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: userExists.id } },
    });

    if (existing?.status === "ACTIVE") return NextResponse.json({ error: "Already a member.", status: "ACTIVE" }, { status: 409 });
    if (existing?.status === "PENDING") return NextResponse.json({ error: "Request already pending.", status: "PENDING" }, { status: 409 });
    if (existing?.status === "INVITED") return NextResponse.json({ error: "You have a pending invitation.", status: "INVITED" }, { status: 409 });

    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: userExists.id } },
        update: { status: "PENDING" },
        create: {
            groupId,
            userId: userExists.id,
            status: "PENDING",
            role: "MEMBER",
        },
    });

    // Notify ALL admins
    const admins = await prisma.communityMember.findMany({
        where: { groupId, role: "ADMIN", status: "ACTIVE" },
        select: { userId: true },
    });

    for (const admin of admins) {
        const notif = await prisma.notification.create({
            data: {
                userId: admin.userId,
                title: `Join request — ${group.name}`,
                body: `${userExists.name ?? "Someone"} wants to join your group.`,
                href: `/community`,
            },
        });
        await pusher.trigger(`user-${admin.userId}`, "notification:new", notif);
        await pusher.trigger(`user-${admin.userId}`, "join:request:new", {
            groupId,
            groupName: group.name,
            userId: userExists.id,
            userName: userExists.name,
            userImage: userExists.image,
        });
    }

    return NextResponse.json({ status: "PENDING" });
}