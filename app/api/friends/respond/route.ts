import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { senderId, action } = await req.json();
    // action: "accept" | "reject"

    if (!senderId || !["accept", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Find the request where senderId sent TO current user
    const friendship = await prisma.friendship.findUnique({
        where: { userId_friendId: { userId: senderId, friendId: session.user.id } },
    });

    if (!friendship || friendship.status !== "REQUESTED") {
        return NextResponse.json({ error: "No pending request found." }, { status: 404 });
    }

    if (action === "accept") {
        await prisma.friendship.update({
            where: { userId_friendId: { userId: senderId, friendId: session.user.id } },
            data: { status: "ADDED" },
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

    } else {
        // Reject — delete the row
        await prisma.friendship.delete({
            where: { userId_friendId: { userId: senderId, friendId: session.user.id } },
        });
    }

    return NextResponse.json({ success: true, action });
}