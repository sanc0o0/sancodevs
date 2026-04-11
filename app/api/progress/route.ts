import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathId, moduleIndex } = await req.json();

    if (typeof pathId !== "string" || typeof moduleIndex !== "number") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.userProgress.upsert({
        where: {
            userId_pathId_moduleIndex: {
                userId: session.user.id,
                pathId,
                moduleIndex,
            },
        },
        update: {},
        create: {
            userId: session.user.id,
            pathId,
            moduleIndex,
        },
    });

    return NextResponse.json({ success: true });
}