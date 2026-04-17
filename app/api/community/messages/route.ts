import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json([]);

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Not a member." }, { status: 403 });
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

    return NextResponse.json(messages.map(formatMessage));
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, content, mediaUrl, mediaType, replyToId } = await req.json();
    if (!content?.trim() && !mediaUrl) return NextResponse.json({ error: "Empty." }, { status: 400 });

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Not a member." }, { status: 403 });
    }

    const message = await prisma.communityMessage.create({
        data: {
            groupId,
            userId: session.user.id,
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

    const formatted = formatMessage(message);

    // Real-time: emit to group channel
    await pusher.trigger(`group-${groupId}`, "message:new", formatted);

    // Handle @mentions
    if (content) {
        const mentions = content.match(/@(\w+)/g) ?? [];
        if (mentions.length > 0) {
            const names = mentions.map((m: string) => m.slice(1));
            const mentionedUsers = await prisma.user.findMany({
                where: { name: { in: names } },
                select: { id: true },
            });
            for (const u of mentionedUsers) {
                if (u.id === session.user.id) continue;
                const notif = await prisma.notification.create({
                    data: {
                        userId: u.id,
                        title: `${session.user.name} mentioned you`,
                        body: content.slice(0, 80),
                        href: `/community/${groupId}`,
                    },
                });
                await pusher.trigger(`user-${u.id}`, "notification:new", notif);
            }
        }
    }

    return NextResponse.json(formatted, { status: 201 });
}

function formatMessage(m: any) {
    return {
        ...m,
        createdAt: m.createdAt.toISOString(),
        reactions: Object.values(
            (m.reactions ?? []).reduce((acc: any, r: any) => {
                if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, userIds: [] };
                acc[r.emoji].userIds.push(r.userId);
                return acc;
            }, {} as Record<string, { emoji: string; userIds: string[] }>)
        ),
    };
}