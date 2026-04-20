import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { user1Id: session.user.id },
                { user2Id: session.user.id },
            ],
        },
        include: {
            user1: { select: { id: true, name: true, email: true, image: true } },
            user2: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map(f => {
        const friend = f.user1Id === session.user.id ? f.user2 : f.user1;
        return { friendshipId: f.id, ...friend };
    });

    return NextResponse.json(friends);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId } = await req.json();
    const [user1Id, user2Id] = [session.user.id, friendId].sort();

    await prisma.friendship.delete({
        where: { user1Id_user2Id: { user1Id, user2Id } },
    }).catch(() => { });

    return NextResponse.json({ success: true });
}