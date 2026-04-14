import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED", "TERMINATED"];

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (project.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Only the project owner can update status." }, { status: 403 });
    }

    const updated = await prisma.project.update({
        where: { id },
        data: { status },
    });

    return NextResponse.json(updated);
}