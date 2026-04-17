import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });

    if (!member) return NextResponse.json({ error: "Not a member." }, { status: 404 });

    // Admins can't leave (must transfer ownership first)
    if (member.role === "ADMIN") {
        return NextResponse.json({ error: "Transfer admin role before leaving." }, { status: 400 });
    }

    await prisma.communityMember.update({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        data: { status: "LEFT" },
    });

    // After updating status to LEFT:
    await pusher.trigger(`group-${groupId}`, "member:left", {
        userId: session.user.id,
        userName: session.user.name,
    });
    return NextResponse.json({ success: true });
}