// app/api/projects/save/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─── Resolve real DB user from session email ──────────────────────────────────
// session.user.id is correctly set via JWT callback for established sessions,
// but using email as the lookup is a safe double-guarantee for all auth methods.
async function resolveUserId(email: string | null | undefined): Promise<string | null> {
    if (!email) return null;
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });
    return user?.id ?? null;
}

// GET — check if current user has saved a project
// /api/projects/save?projectId=xxx
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ saved: false }, { status: 401 });

    const userId = await resolveUserId(session.user.email);
    if (!userId) return NextResponse.json({ saved: false }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ saved: false }, { status: 400 });

    const saved = await prisma.savedProject.findUnique({
        where: { userId_projectId: { userId, projectId } },
        select: { id: true },
    });

    return NextResponse.json({ saved: !!saved });
}

// POST — toggle save
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await resolveUserId(session.user.email);
    if (!userId) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const existing = await prisma.savedProject.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
        await prisma.savedProject.delete({ where: { id: existing.id } });
        return NextResponse.json({ saved: false });
    } else {
        await prisma.savedProject.create({
            data: { userId, projectId },
        });
        return NextResponse.json({ saved: true });
    }
}