import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageIds, groupId } = await req.json();
    if (!Array.isArray(messageIds) || !messageIds.length) return NextResponse.json({ success: true });

    for (const messageId of messageIds) {
        await prisma.messageReceipt.upsert({
            where: { messageId_userId: { messageId, userId: session.user.id } },
            update: {},
            create: { messageId, userId: session.user.id },
        }).catch(() => { });
    }

    if (groupId) {
        await pusher.trigger(`group-${groupId}`, "message:seen:update", {
            userId: session.user.id,
            messageIds,
        });
    }

    return NextResponse.json({ success: true });
}