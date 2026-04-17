import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([]);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.notification.deleteMany({
        where: { userId: session.user.id, read: true, createdAt: { lt: cutoff } },
    }).catch(() => { });

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return NextResponse.json(notifications);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    await prisma.notification.update({
        where: { id },
        data: { read: true },
    });

    return NextResponse.json({ success: true });
}

// Helper to create + push notification (use this everywhere)
export async function createNotification({
    userId, title, body, href,
}: {
    userId: string;
    title: string;
    body: string;
    href?: string;
}) {
    const notif = await prisma.notification.create({
        data: { userId, title, body, href: href ?? null },
    });
    await pusher.trigger(`user-${userId}`, "notification:new", notif);
    return notif;
}