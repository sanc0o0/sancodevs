import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.userActivity.upsert({
        where: { userId: session.user.id },
        update: { lastSeenProjectsAt: new Date() },
        create: { userId: session.user.id, lastSeenProjectsAt: new Date() },
    });

    return NextResponse.json({ success: true });
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ unseen: 0 });

    const activity = await prisma.userActivity.findUnique({
        where: { userId: session.user.id },
    });

    const lastSeen = activity?.lastSeenProjectsAt ?? new Date(0);

    const unseen = await prisma.project.count({
        where: { createdAt: { gt: lastSeen } },
    });

    return NextResponse.json({ unseen });
}