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

    const existing = await prisma.friendship.findUnique({
        where: { userId_friendId: { userId: session.user.id, friendId: targetUserId } },
    });
    if (existing) return NextResponse.json({ status: existing.status }, { status: 409 });

    await prisma.friendship.create({
        data: { userId: session.user.id, friendId: targetUserId, status: "REQUESTED" },
    });

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
    const notif = await prisma.notification.create({
        data: {
            userId: targetUserId,
            title: "Friend request",
            body: `${session.user.name ?? "Someone"} sent you a friend request.`,
            href: `/user/${session.user.id}`,
        },
    });
    await pusher.trigger(`user-${targetUserId}`, "notification:new", notif);

    return NextResponse.json({ status: "REQUESTED" });
}