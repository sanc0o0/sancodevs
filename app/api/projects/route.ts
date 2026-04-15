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
        title, description, difficulty, maxMembers, techStack, lookingFor,
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

    const normalizedTechStack = (techStack ?? []).map((t: string) =>
        t.toLowerCase().trim()
    );

    const project = await prisma.project.create({
        data: {
            title,
            description,
            createdBy: session.user.id,
            status: "OPEN",
            difficulty,
            techStack: normalizedTechStack,
            lookingFor,
            maxMembers,
            projectUrl,
            repoUrl,
        },
    });

  
    // Only notify if project has techStack
    if (normalizedTechStack.length > 0) {
        // Step 1: Find users with overlapping preferences
        const matchingPrefs = await prisma.userPreferences.findMany({
            where: {
                userId: { not: session.user.id },
                prefTechs: { hasSome: normalizedTechStack },
            },
            select: {
                userId: true,
                prefTechs: true,
            },
        });

        // Step 2: Safety check (handles any bad/unnormalized DB data)
        const trulyMatching = matchingPrefs.filter(pref =>
            pref.prefTechs.some(t =>
                normalizedTechStack.includes(t.toLowerCase().trim())
            )
        );

        // Step 3: Create notifications (only for real matches)
        if (trulyMatching.length > 0) {
            await prisma.notification.createMany({
                data: trulyMatching.map(pref => {
                    const matchedTechs = pref.prefTechs.filter(t =>
                        normalizedTechStack.includes(t.toLowerCase().trim())
                    );

                    return {
                        userId: pref.userId,
                        title: "New project matches your interests",
                        body: `"${title}" uses ${matchedTechs.slice(0, 2).join(", ")} — check it out.`,
                        href: `/projects/${project.id}`,
                    };
                }),
            });
        }
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