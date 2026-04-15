import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();

    await prisma.communityMember.upsert({
        where: { groupId_userId: { groupId, userId: session.user.id } },
        update: {},
        create: { groupId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
}