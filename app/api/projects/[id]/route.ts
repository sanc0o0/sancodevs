// app/api/projects/[id]/route.ts

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
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve real DB user by email — safe for all auth methods
    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!dbUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
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

    // Use resolved dbUser.id, not session.user.id
    if (project.createdBy !== dbUser.id) {
        return NextResponse.json({ error: "Only the project owner can update status." }, { status: 403 });
    }

    const updated = await prisma.project.update({
        where: { id },
        data: { status },
    });

    return NextResponse.json(updated);
}