import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: groupId } = await params;

    const adminMember = await prisma.communityMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
    });
    if (!adminMember || adminMember.role !== "ADMIN") {
        return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const pending = await prisma.communityMember.findMany({
        where: { groupId, status: "PENDING" },
        include: {
            user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(pending);
}