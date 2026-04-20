import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetId } = await req.json();
    if (!targetId) return NextResponse.json({ error: "targetId required." }, { status: 400 });

    // Remove friendship if exists
    const [user1Id, user2Id] = [session.user.id, targetId].sort();
    await prisma.friendship.delete({
        where: { user1Id_user2Id: { user1Id, user2Id } },
    }).catch(() => { });

    // Remove any friend requests
    await prisma.friendRequest.deleteMany({
        where: {
            OR: [
                { senderId: session.user.id, receiverId: targetId },
                { senderId: targetId, receiverId: session.user.id },
            ],
        },
    }).catch(() => { });

    // Create block
    await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetId } },
        update: {},
        create: { blockerId: session.user.id, blockedId: targetId },
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetId } = await req.json();
    await prisma.block.delete({
        where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetId } },
    }).catch(() => { });

    return NextResponse.json({ success: true });
}