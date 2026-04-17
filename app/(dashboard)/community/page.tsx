import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CommunityShell from "./CommunityShell";

export default async function CommunityPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const myGroups = await prisma.communityGroup.findMany({
        where: {
            members: { some: { userId: session.user.id, status: "ACTIVE" } },
        },
        include: {
            members: {
                where: { status: "ACTIVE" },
                select: { userId: true, muted: true, pinned: true },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: { user: { select: { name: true } } },
            },
            _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const discoverGroups = await prisma.communityGroup.findMany({
        where: {
            isPrivate: false,
            members: { none: { userId: session.user.id } },
        },
        include: { _count: { select: { members: true } } },
        take: 8,
        orderBy: { createdAt: "desc" },
    });

    return (
        <CommunityShell
            myGroups={myGroups.map(g => ({
                id: g.id,
                name: g.name,
                description: g.description,
                isPrivate: g.isPrivate,
                memberCount: g._count.members,
                muted: g.members.find(m => m.userId === session.user.id)?.muted ?? false,
                pinned: g.members.find(m => m.userId === session.user.id)?.pinned ?? false,
                lastMessage: g.messages[0]
                    ? {
                        senderName: g.messages[0].user.name,
                        content: g.messages[0].content,
                        createdAt: g.messages[0].createdAt.toISOString(),
                    }
                    : null,
            }))}
            discoverGroups={discoverGroups.map(g => ({
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
    );
}