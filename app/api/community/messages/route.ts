import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json([]);

    // CRITICAL: verify membership before returning ANY messages
    const member = await prisma.communityMember.findUnique({
        where: {
            groupId_userId: { groupId, userId: session.user.id },
        },
    });

    if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Not a member of this group." }, { status: 403 });
    }

    const messages = await prisma.communityMessage.findMany({
        where: { groupId },
        include: {
            user: { select: { id: true, name: true, image: true } },
            receipts: { select: { userId: true } },
            reactions: { select: { userId: true, emoji: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
    });

    return NextResponse.json(messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        reactions: Object.values(
            m.reactions.reduce((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, userIds: [] };
                acc[r.emoji].userIds.push(r.userId);
                return acc;
            }, {} as Record<string, { emoji: string; userIds: string[] }>)
        ),
    })));
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, content, mediaUrl, mediaType } = await req.json();
    if (!content?.trim() && !mediaUrl) {
        return NextResponse.json({ error: "Empty message." }, { status: 400 });
    }

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    const message = await prisma.communityMessage.create({
        data: {
            groupId, userId: session.user.id,
            content: content?.trim() || null,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
        },
        include: {
            user: { select: { id: true, name: true, image: true } },
            receipts: { select: { userId: true } },
            reactions: { select: { userId: true, emoji: true } },
        },
    });

    return NextResponse.json({
        ...message,
        createdAt: message.createdAt.toISOString(),
        reactions: [],
    }, { status: 201 });
}