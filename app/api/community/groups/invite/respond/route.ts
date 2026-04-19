import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, action } = await req.json();
    // action: "accept" | "reject"

    if (!groupId || !["accept", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const member = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });

    if (!member || member.status !== "INVITED") {
        return NextResponse.json({ error: "No pending invitation found." }, { status: 404 });
    }

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

    if (action === "accept") {
        await prisma.communityMember.update({
            where: { groupId_userId: { groupId, userId: session.user.id } },
            data: { status: "ACTIVE" },
        });

        // Notify group
        await pusher.trigger(`group-${groupId}`, "member:joined", {
            userId: session.user.id,
            userName: session.user.name,
        });

        return NextResponse.json({ status: "ACTIVE" });
    } else {
        // Reject — remove the entry
        await prisma.communityMember.delete({
            where: { groupId_userId: { groupId, userId: session.user.id } },
        });

        return NextResponse.json({ status: "REJECTED" });
    }
}