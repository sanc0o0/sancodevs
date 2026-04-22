import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ids: [] });

    const blocks = await prisma.block.findMany({
        where: {
            OR: [
                { blockerId: session.user.id },
                { blockedId: session.user.id },
            ],
        },
        select: { blockerId: true, blockedId: true },
    });

    const ids = blocks.map(b =>
        b.blockerId === session.user.id ? b.blockedId : b.blockerId
    );

    return NextResponse.json({ ids });
}