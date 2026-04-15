import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            applicants: { select: { userId: true } },
            _count: { select: { applicants: true } },
        },
    });
    return NextResponse.json(projects);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
        title, description, difficulty, maxMembers, techStack, lookingFor, type,
        projectUrl, repoUrl, createCommunity, communityName,
    } = await req.json();

    if (!title || !description || !difficulty) {
        return NextResponse.json({ error: "Title, description, and difficulty are required." }, { status: 400 });
    }

    // Validate repo URL format
    if (repoUrl && !repoUrl.includes("github.com") && !repoUrl.includes("gitlab.com") && !repoUrl.includes("bitbucket.org")) {
        return NextResponse.json({ error: "Repo URL must be a valid GitHub, GitLab, or Bitbucket link." }, { status: 400 });
    }

    // Check if project URL is reachable
    if (projectUrl) {
        try {
            const res = await fetch(projectUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
            if (!res.ok) {
                return NextResponse.json({ error: "Project URL is not reachable. Make sure it's live." }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: "Could not reach the project URL. Is it live?" }, { status: 400 });
        }
    }

    const project = await prisma.project.create({
        data: {
            title,
            description,
            createdBy: session.user.id,
            status: "OPEN",
            difficulty,
            techStack: techStack ?? [],
            lookingFor,
            type,
            maxMembers,
            projectUrl,
            repoUrl,
        },
    });

    // After creating the project, notify matching users
    const allPrefs = await prisma.userPreferences.findMany({
        where: {
            prefTechs: { hasSome: techStack ?? [] },
            userId: { not: session.user.id },
        },
        select: { userId: true },
    });

    for (const pref of allPrefs) {
        await prisma.notification.create({
            data: {
                userId: pref.userId,
                title: `New project matches your interests`,
                body: `"${title}" uses ${techStack?.slice(0, 3).join(", ")} and more.`,
                href: `/projects/${project.id}`,
            },
        });
    }

    // Create community group if requested
    if (createCommunity) {
        const group = await prisma.communityGroup.create({
            data: {
                name: `${communityName || title} · ${project.id.slice(0, 6)}`,
                description: `Community for the "${title}" project`,
                createdBy: session.user.id,
                members: { create: { userId: session.user.id, role: "ADMIN" } },
            },
        });

        await prisma.project.update({
            where: { id: project.id },
            data: { communityGroupId: group.id },
        });
    }

    await prisma.notification.create({
        data: {
            userId: session.user.id,
            title: "Project created",
            body: `Your project "${title}" is now live.`,
            href: `/projects/${project.id}`,
        },
    });

    return NextResponse.json(project, { status: 201 });
}