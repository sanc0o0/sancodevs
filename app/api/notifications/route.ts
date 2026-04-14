import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([]);

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