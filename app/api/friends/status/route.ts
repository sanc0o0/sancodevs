import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ status: "NONE" });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) return NextResponse.json({ status: "NONE" });

    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { userId: session.user.id, friendId: targetUserId },
                { userId: targetUserId, friendId: session.user.id },
            ],
        },
        select: { userId: true, friendId: true, status: true },
    });

    if (!friendship) return NextResponse.json({ status: "NONE" });

    if (friendship.status === "ADDED") {
        return NextResponse.json({ status: "ADDED" });
    }

    if (friendship.status === "BLOCKED") {
        // Only the blocker knows — return NONE to blocked user
        if (friendship.userId === session.user.id) {
            return NextResponse.json({ status: "BLOCKED" });
        }
        return NextResponse.json({ status: "NONE" });
    }

    if (friendship.status === "REQUESTED") {
        // The person who sent the request sees "REQUESTED"
        if (friendship.userId === session.user.id) {
            return NextResponse.json({ status: "REQUESTED" });
        }
        // The person who received it sees "PENDING_ACTION" → show Accept/Reject
        return NextResponse.json({ status: "PENDING_ACTION" });
    }

    return NextResponse.json({ status: "NONE" });
}