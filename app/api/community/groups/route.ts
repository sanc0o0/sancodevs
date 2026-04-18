import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, emails, isPrivate } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const group = await prisma.communityGroup.create({
        data: {
            name, 
            description: description || null,
            isPrivate: isPrivate ?? true,
            createdBy: session.user.id,
            members: { 
                create: { 
                    userId: session.user.id, 
                    role: "ADMIN",
                    status: "ACTIVE",
                } 
            },
        },
    });

    // Add members by email
    if (emails?.length) {
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, email: true },
        });

        for (const user of users) {
            if (user.id === session.user.id) continue;
            await prisma.communityMember.create({
                data: { groupId: group.id, userId: user.id, status: isPrivate ? "PENDING" : "ACTIVE", },
            }).catch(() => { });

            await prisma.notification.create({
                data: {
                    userId: user.id,
                    title: `You were added to "${name}"`,
                    body: `${session.user.name ?? "Someone"} added you to a community group.`,
                    href: `/community/${group.id}`,
                },
            });
        }
    }

    return NextResponse.json(group, { status: 201 });
}