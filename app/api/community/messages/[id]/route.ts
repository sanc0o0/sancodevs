import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Empty." }, { status: 400 });

    const message = await prisma.communityMessage.findUnique({ where: { id } });
    if (!message || message.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.communityMessage.update({ where: { id }, data: { content: content.trim() } });
    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const message = await prisma.communityMessage.findUnique({ where: { id } });
    if (!message || message.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.communityMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
}