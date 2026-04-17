import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// app/api/projects/seen/route.ts
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Guard: ensure user actually exists in DB before foreign key write
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.userActivity.upsert({
        where: { userId: session.user.id },
        update: { lastSeenProjectsAt: new Date() },
        create: { userId: session.user.id, lastSeenProjectsAt: new Date() },
    });

    return NextResponse.json({ ok: true });
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