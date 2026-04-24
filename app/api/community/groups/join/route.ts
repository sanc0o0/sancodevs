import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { groupId } = body;

        if (!groupId) {
            return NextResponse.json({ error: "groupId required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, image: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const group = await prisma.communityGroup.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found." }, { status: 404 });
        }

        if (group.isPrivate) {
            return NextResponse.json({ error: "This group is private." }, { status: 403 });
        }

        const existing = await prisma.communityMember.findUnique({
            where: { groupId_userId: { groupId, userId: user.id } },
        });

        if (existing?.status === "ACTIVE") {
            return NextResponse.json({ error: "Already a member.", status: "ACTIVE" }, { status: 409 });
        }
        if (existing?.status === "PENDING") {
            return NextResponse.json({ error: "Request already pending.", status: "PENDING" }, { status: 409 });
        }

        await prisma.communityMember.upsert({
            where: { groupId_userId: { groupId, userId: user.id } },
            update: { status: "PENDING" },
            create: {
                groupId,
                userId: user.id,
                status: "PENDING",
                role: "MEMBER",
            },
        });

        const admins = await prisma.communityMember.findMany({
            where: { groupId, role: "ADMIN", status: "ACTIVE" },
            select: { userId: true },
        });

        for (const admin of admins) {
            const notif = await prisma.notification.create({
                data: {
                    userId: admin.userId,
                    title: `Join request — ${group.name}`,
                    body: `${user.name ?? "Someone"} wants to join your group.`,
                    href: `/community`,
                },
            });
            await pusher.trigger(`user-${admin.userId}`, "notification:new", notif);
            await pusher.trigger(`user-${admin.userId}`, "join:request:new", {
                groupId,
                groupName: group.name,
                userId: user.id,
                userName: user.name,
                userImage: user.image,
            });
        }

        return NextResponse.json({ status: "PENDING" });

    } catch (error) {
        console.error("JOIN ROUTE ERROR:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}