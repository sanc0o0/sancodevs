import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();

    const message = await prisma.communityMessage.findUnique({ where: { id } });
    if (!message || message.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const updated = await prisma.communityMessage.update({
        where: { id },
        data: { content: content.trim() },
    });

    await pusher.trigger(`group-${message.groupId}`, "message:updated", {
        id,
        content: updated.content,
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const message = await prisma.communityMessage.findUnique({ where: { id } });
    if (!message || message.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    // Soft delete — update content
    await prisma.communityMessage.update({
        where: { id },
        data: { content: null, mediaUrl: null, mediaType: null },
    });

    await pusher.trigger(`group-${message.groupId}`, "message:deleted", { id });

    return NextResponse.json({ success: true });
}