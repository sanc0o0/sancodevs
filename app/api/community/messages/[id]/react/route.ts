import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: messageId } = await params;
    const { emoji } = await req.json();

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

    return NextResponse.json({ success: true });
}