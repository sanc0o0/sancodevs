import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { senderId, action } = await req.json();
    if (!senderId || !["accept", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const request = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId, receiverId: session.user.id } },
    });
    if (!request) return NextResponse.json({ error: "No request found." }, { status: 404 });

    // Delete the request regardless of action
    await prisma.friendRequest.delete({
        where: { senderId_receiverId: { senderId, receiverId: session.user.id } },
    });

    if (action === "accept") {
        // Create friendship — always sort IDs
        const [user1Id, user2Id] = [senderId, session.user.id].sort();
        await prisma.friendship.create({
            data: { user1Id, user2Id },
        });

        const notif = await prisma.notification.create({
            data: {
                userId: senderId,
                title: "Friend request accepted",
                body: `${session.user.name ?? "Someone"} accepted your friend request.`,
                href: `/user/${session.user.id}`,
            },
        });
        await pusher.trigger(`user-${senderId}`, "notification:new", notif);
    }

    return NextResponse.json({ success: true, action });
}