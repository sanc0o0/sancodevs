import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CommunityShell from "./CommunityShell";
import { Suspense } from "react";

export default async function CommunityPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Section 1: CHATS — user is ACTIVE member
    const myGroups = await prisma.communityGroup.findMany({
        where: {
            members: { some: { userId: session.user.id, status: "ACTIVE" } },
        },
        include: {
            members: {
                where: { userId: session.user.id, status: "ACTIVE" },
                select: { muted: true, pinned: true, role: true },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: { user: { select: { name: true } } },
            },
            _count: { select: { members: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Section 2: REQUESTS — user has PENDING or INVITED status
    const myRequests = await prisma.communityMember.findMany({
        where: {
            userId: session.user.id,
            status: { in: ["PENDING", "INVITED"] },
        },
        include: {
            group: {
                select: {
                    id: true, name: true, description: true, isPrivate: true,
                    _count: { select: { members: { where: { status: "ACTIVE" } } } },
                },
            },
        },
    });

    // Section 3: DISCOVER — public groups user has no membership in at all
    const discoverGroups = await prisma.communityGroup.findMany({
        where: {
            isPrivate: false,
            members: { none: { userId: session.user.id } },
        },
        include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } },
        take: 20,
        orderBy: { createdAt: "desc" },
    });

    return (
        <Suspense fallback={null}>

            <CommunityShell
                myGroups={myGroups.map(g => ({
                    id: g.id,
                    name: g.name,
                    description: g.description,
                    isPrivate: g.isPrivate,
                    memberCount: g._count.members,
                    muted: g.members[0]?.muted ?? false,
                    pinned: g.members[0]?.pinned ?? false,
                    role: (g.members[0]?.role ?? "MEMBER") as "ADMIN" | "MEMBER",
                    lastMessage: g.messages[0] ? {
                        senderName: g.messages[0].user.name,
                        content: g.messages[0].content,
                        createdAt: g.messages[0].createdAt.toISOString(),
                    } : null,
                }))}
                myRequests={myRequests.map(r => ({
                    groupId: r.groupId,
                    status: r.status as "PENDING" | "INVITED",
                    group: {
                        id: r.group.id,
                        name: r.group.name,
                        description: r.group.description,
                        isPrivate: r.group.isPrivate,
                        memberCount: r.group._count.members,
                    },
                }))}
                myDiscoverGroups={discoverGroups.map(g => ({
                    id: g.id,
                    name: g.name,
                    description: g.description,
                    isPrivate: g.isPrivate,
                    memberCount: g._count.members,
                }))}
                currentUserId={session.user.id}
                currentUserName={session.user.name ?? ""}
                currentUserImage={session.user.image ?? null}
            />
        </Suspense>
    );
}