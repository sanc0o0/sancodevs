import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    const existing = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });

    if (existing) {
        if (existing.status === "ACTIVE") return NextResponse.json({ error: "Already a member." }, { status: 409 });
        if (existing.status === "PENDING") return NextResponse.json({ error: "Request already pending." }, { status: 409 });
    }

    if (group.isPrivate) {
        // Create pending request
        await prisma.communityMember.upsert({
            where: { groupId_userId: { groupId, userId: session.user.id } },
            update: { status: "PENDING" },
            create: { groupId, userId: session.user.id, status: "PENDING" },
        });

        // Notify admin
        const admin = await prisma.communityMember.findFirst({
            where: { groupId, role: "ADMIN" },
        });
        if (admin) {
            await prisma.notification.create({
                data: {
                    userId: admin.userId,
                    title: `Join request — ${group.name}`,
                    body: `${session.user.name ?? "Someone"} wants to join your community.`,
                    href: `/community/${groupId}`,
                },
            });
        }

        return NextResponse.json({ status: "PENDING" });
    }

    // Public group — instant join
    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        update: { status: "ACTIVE" },
        create: { groupId, userId: session.user.id, status: "ACTIVE" },
    });

    return NextResponse.json({ status: "ACTIVE" });
}