import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ── GET — check if current user has saved this project ───────────────────────

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
        return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const saved = await prisma.savedProject.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
        select: { id: true },
    });

    return NextResponse.json({ saved: !!saved });
}

// ── POST — toggle save / unsave ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId } = await req.json() as { projectId?: string };
    if (!projectId) {
        return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
    });
    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await prisma.savedProject.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
        select: { id: true },
    });

    if (existing) {
        // Already saved → unsave
        await prisma.savedProject.delete({
            where: { userId_projectId: { userId: user.id, projectId } },
        });
        return NextResponse.json({ saved: false });
    } else {
        // Not saved → save
        await prisma.savedProject.create({
            data: { userId: user.id, projectId },
        });
        return NextResponse.json({ saved: true });
    }
}