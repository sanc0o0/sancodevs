import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found in DB" },
            { status: 401 }
        );
      };

    console.log("SESSION ID:", session.user.id);

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    console.log("DB USER:", dbUser);
    
    const { groupId } = await req.json();
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const existing = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    console.log("SESSION USER:", session.user)

    if (existing?.status === "ACTIVE") return NextResponse.json({ error: "Already a member." }, { status: 409 });
    if (existing?.status === "PENDING") return NextResponse.json({ error: "Request pending." }, { status: 409 });

    if (group.isPrivate) {
        await prisma.communityMember.upsert({
            where: { groupId_userId: { groupId, userId: session.user.id } },
            update: { status: "PENDING" },
            create: { groupId, userId: session.user.id, status: "PENDING" },
        });

        const admin = await prisma.communityMember.findFirst({
            where: { groupId, role: "ADMIN", status: "ACTIVE" },
        });

        if (admin) {
            const notif = await prisma.notification.create({
                data: {
                    userId: admin.userId,
                    title: `Join request — ${group.name}`,
                    body: `${session.user.name} wants to join.`,
                    href: `/community/${groupId}`,
                },
            });
            // Real-time to admin
            await pusher.trigger(`user-${admin.userId}`, "notification:new", notif);
            await pusher.trigger(`user-${admin.userId}`, "join:request:new", {
                groupId,
                userId: session.user.id,
                userName: session.user.name,
                userImage: session.user.image,
            });
        }

        return NextResponse.json({ status: "PENDING" });
    }

    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        update: { status: "ACTIVE" },
        create: { groupId, userId: session.user.id, status: "ACTIVE" },
    });

    await pusher.trigger(`group-${groupId}`, "member:joined", {
        userId: session.user.id,
        userName: session.user.name,
        userImage: session.user.image,
    });

    return NextResponse.json({ status: "ACTIVE" });
}