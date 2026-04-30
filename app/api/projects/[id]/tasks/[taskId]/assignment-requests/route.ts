import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const requests = await prisma.taskAssignmentRequest.findMany({
        where: { taskId, status: "PENDING" },
        include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(requests);
}