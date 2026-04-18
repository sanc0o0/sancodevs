import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

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
    // After creating the project:
    if (techStack && techStack.length > 0) {
        // Normalize project tech stack
        const normalizedProjectTechs: string[] = techStack
            .map((t: string) => t.toLowerCase().trim())
            .filter(Boolean);

        if (normalizedProjectTechs.length > 0) {
            // Get ALL user preferences
            const allPrefs = await prisma.userPreferences.findMany({
                where: { userId: { not: session.user.id } },
                select: { userId: true, prefTechs: true },
            });

            // Filter in code with normalized comparison (bulletproof)
            const matchingUsers = allPrefs.filter(pref => {
                if (!pref.prefTechs || pref.prefTechs.length === 0) return false;
                const normalizedPrefTechs: string[] = pref.prefTechs
                    .map((t: string) => t.toLowerCase().trim());
                return normalizedProjectTechs.some((pt) => normalizedPrefTechs.includes(pt));
            });

            const matchedTechDisplay = techStack.slice(0, 2).join(", ");

            await Promise.all(
                matchingUsers.map(async (pref) => {
                    const notif = await prisma.notification.create({
                        data: {
                            userId: pref.userId,
                            title: "New project matches your stack",
                            body: `"${title}" uses ${matchedTechDisplay}${techStack.length > 2 ? " and more" : ""}.`,
                            href: `/projects/${project.id}`,
                        },
                    });

                    await pusher.trigger(`user-${pref.userId}`, "notification:new", notif);
                })
              );
        }
    }
    // If no techStack → notify NOBODY (removed global notification fallback)

   

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

    return NextResponse.json(project, { status: 201 });
}