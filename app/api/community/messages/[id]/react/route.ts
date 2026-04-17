import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: messageId } = await params;
    const { emoji } = await req.json();

    const message = await prisma.communityMessage.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const existing = await prisma.messageReaction.findUnique({
        where: { messageId_userId_emoji: { messageId, userId: session.user.id, emoji } },
    });

    if (existing) {
        await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
        await prisma.messageReaction.create({
            data: { messageId, userId: session.user.id, emoji },
        });
    }

    // Get updated reactions
    const reactions = await prisma.messageReaction.findMany({
        where: { messageId },
        select: { userId: true, emoji: true },
    });

    const grouped = Object.values(
        reactions.reduce((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, userIds: [] };
            acc[r.emoji].userIds.push(r.userId);
            return acc;
        }, {} as Record<string, { emoji: string; userIds: string[] }>)
    );

    await pusher.trigger(`group-${message.groupId}`, "reaction:update", {
        messageId,
        reactions: grouped,
    });

    return NextResponse.json({ success: true });
}