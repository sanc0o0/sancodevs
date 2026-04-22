import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const blocks = await prisma.block.findMany({
        where: { blockerId: session.user.id },
        include: {
            blocked: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blocks.map(b => b.blocked));
}