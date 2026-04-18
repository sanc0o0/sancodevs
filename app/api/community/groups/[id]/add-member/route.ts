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
    const { email } = await req.json();

    if (!email?.trim()) return NextResponse.json({ error: "Email required." }, { status: 400 });

    // Admin check
    const adminMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!adminMember || adminMember.role !== "ADMIN" || adminMember.status !== "ACTIVE") {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, name: true, email: true, image: true },
    });

    if (!targetUser) {
        return NextResponse.json({ error: "User not found. Make sure they have a SancoDevs account." }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
        return NextResponse.json({ error: "You're already in this group." }, { status: 400 });
    }

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    // Check if already member
    const existingMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: targetUser.id } },
    });

    if (existingMember?.status === "ACTIVE") {
        return NextResponse.json({ error: "User is already a member." }, { status: 409 });
    }

    // Add or reactivate
    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: targetUser.id } },
        update: { status: "ACTIVE" },
        create: { groupId, userId: targetUser.id, status: "ACTIVE", role: "MEMBER" },
    });

    // Notify the added user
    const notif = await prisma.notification.create({
        data: {
            userId: targetUser.id,
            title: `Added to "${group.name}"`,
            body: `${session.user.name ?? "An admin"} added you to the group.`,
            href: `/community`,
        },
    });
    await pusher.trigger(`user-${targetUser.id}`, "notification:new", notif);
    await pusher.trigger(`user-${targetUser.id}`, "join:accepted", {
        groupId, groupName: group.name,
    });
    await pusher.trigger(`group-${groupId}`, "member:joined", {
        userId: targetUser.id,
        userName: targetUser.name,
    });

    return NextResponse.json({ success: true, user: targetUser });
}