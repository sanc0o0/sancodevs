import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId || targetUserId === session.user.id) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Check if blocked
    const blocked = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: session.user.id, blockedId: targetUserId },
                { blockerId: targetUserId, blockedId: session.user.id },
            ],
        },
    });
    if (blocked) return NextResponse.json({ error: "Cannot send request." }, { status: 403 });

    // Check if already friends
    const [u1, u2] = [session.user.id, targetUserId].sort();
    const alreadyFriends = await prisma.friendship.findUnique({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });
    if (alreadyFriends) return NextResponse.json({ error: "Already friends." }, { status: 409 });

    // Check existing request
    const existing = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: session.user.id, receiverId: targetUserId } },
    });
    if (existing) return NextResponse.json({ status: "REQUESTED" }, { status: 409 });

    await prisma.friendRequest.create({
        data: { senderId: session.user.id, receiverId: targetUserId },
    });

    const notif = await prisma.notification.create({
        data: {
            userId: targetUserId,
            title: "New friend request",
            body: `${session.user.name ?? "Someone"} sent you a friend request.`,
            href: `/user/${session.user.id}`,
        },
    });
    await pusher.trigger(`user-${targetUserId}`, "notification:new", notif);

    return NextResponse.json({ status: "REQUESTED" });
}