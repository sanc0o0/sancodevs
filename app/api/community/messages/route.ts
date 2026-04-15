import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json([]);

    const messages = await prisma.communityMessage.findMany({
        where: { groupId },
        include: { 
            user: { select: { id: true, name: true, image: true } },
            receipts: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
    });

    return NextResponse.json(messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        reactions: [],
    })));
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Empty." }, { status: 400 });

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    const message = await prisma.communityMessage.create({
        data: { groupId, userId: session.user.id, content: content.trim() },
        include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ ...message, createdAt: message.createdAt.toISOString(), reactions: [] }, { status: 201 });
}