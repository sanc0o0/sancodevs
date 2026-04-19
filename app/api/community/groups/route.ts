import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, isPrivate, emails } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required." }, { status: 400 });

    // Create group with creator as ADMIN + ACTIVE
    const group = await prisma.communityGroup.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            isPrivate: isPrivate ?? true,  // default private
            createdBy: session.user.id,
            members: {
                create: {
                    userId: session.user.id,
                    role: "ADMIN",
                    status: "ACTIVE",
                },
            },
        },
    });

    // Invite by email → status: INVITED (not ACTIVE)
    if (emails?.length) {
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, name: true, email: true },
        });

        for (const user of users) {
            if (user.id === session.user.id) continue;

            await prisma.communityMember.create({
                data: {
                    groupId: group.id,
                    userId: user.id,
                    status: "INVITED",  // ← correct status
                    role: "MEMBER",
                },
            }).catch(() => { });

            // Notify invited user
            const notif = await prisma.notification.create({
                data: {
                    userId: user.id,
                    title: `You were invited to "${group.name}"`,
                    body: `${session.user.name ?? "An admin"} invited you to join this group.`,
                    href: `/community?tab=requests`,                },
            });
            await pusher.trigger(`user-${user.id}`, "notification:new", notif);
            await pusher.trigger(`user-${user.id}`, "group:invited", {
                groupId: group.id,
                groupName: group.name,
                invitedBy: session.user.name,
            });
        }
    }

    return NextResponse.json(group, { status: 201 });
}