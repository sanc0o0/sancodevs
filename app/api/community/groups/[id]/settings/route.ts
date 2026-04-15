import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;
    const { muted, pinned } = await req.json();

    await prisma.communityMember.update({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        data: {
            ...(muted !== undefined && { muted }),
            ...(pinned !== undefined && { pinned }),
        },
    });

    return NextResponse.json({ success: true });
}