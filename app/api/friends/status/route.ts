import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ status: "NONE" });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) return NextResponse.json({ status: "NONE" });

    // Check blocked
    const blocked = await prisma.block.findFirst({
        where: { blockerId: session.user.id, blockedId: targetUserId },
    });
    if (blocked) return NextResponse.json({ status: "BLOCKED" });

    // Check friendship (sorted)
    const [u1, u2] = [session.user.id, targetUserId].sort();
    const friendship = await prisma.friendship.findUnique({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });
    if (friendship) return NextResponse.json({ status: "ADDED" });

    // Check outgoing request (I sent to them)
    const outgoing = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: session.user.id, receiverId: targetUserId } },
    });
    if (outgoing) return NextResponse.json({ status: "REQUESTED" });

    // Check incoming request (they sent to me)
    const incoming = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: targetUserId, receiverId: session.user.id } },
    });
    if (incoming) return NextResponse.json({ status: "PENDING_ACTION" });

    return NextResponse.json({ status: "NONE" });
}