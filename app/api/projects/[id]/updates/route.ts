// ─────────────────────────────────────────────────────────────────────────────
// 1. app/api/projects/[id]/updates/route.ts
//    Handles GET (list updates) and POST (create update with isPublic flag)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = project.createdBy === session.user.id;
    const isTeamMember = await prisma.teamMember.findFirst({
        where: { projectId, userId: session.user.id },
        select: { id: true },
    });

    const updates = await prisma.projectUpdate.findMany({
        where: {
            projectId,
            // Non-members only see public updates
            ...(!isOwner && !isTeamMember ? { isPublic: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return NextResponse.json({ updates });
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;

    // Only owner or team members can post updates
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = project.createdBy === session.user.id;
    const isTeamMember = await prisma.teamMember.findFirst({
        where: { projectId, userId: session.user.id },
        select: { id: true },
    });

    if (!isOwner && !isTeamMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, isPublic = true } = await req.json();

    if (!title || !content) {
        return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const update = await prisma.projectUpdate.create({
        data: {
            projectId,
            title,
            content,
            createdBy: session.user.id,
            isPublic: Boolean(isPublic),
        },
    });

    return NextResponse.json({ update });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WORKSPACE — Saved projects query
//    Add this to your workspace/Saved.tsx (or wherever you list saved projects)
// ─────────────────────────────────────────────────────────────────────────────

/*
// In your server component or page that renders saved projects:

const savedProjects = await prisma.savedProject.findMany({
    where: { userId: session.user.id },
    include: {
        project: {
            select: {
                id: true,
                title: true,
                tagline: true,
                status: true,
                domain: true,
                difficulty: true,
                techStack: true,
                coverImage: true,
                accentColor: true,
                owner: { select: { id: true, name: true, username: true, image: true } },
                teams: { select: { id: true }, take: 1 }, // just for count
            },
        },
    },
    orderBy: { savedAt: "desc" },
});

// Then render savedProjects.map(s => s.project) — each has full project data.
// The savedAt field lets you show "Saved 2 days ago" etc.
*/