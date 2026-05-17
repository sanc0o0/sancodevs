import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─── GET /api/projects ────────────────────────────────────────────────────────
// Returns all public projects with counts, owner identity, and team avatars
// for the project card enrichment layer.

export async function GET() {
    const projects = await prisma.project.findMany({
        where: { visibility: { not: "PRIVATE" } },
        orderBy: { createdAt: "desc" },
        include: {
            owner: {
                select: { id: true, username: true, name: true, image: true },
            },
            teams: {
                where: { active: true },
                select: {
                    user: { select: { id: true, image: true, username: true } },
                },
                take: 5,
            },
            milestones: {
                select: { progress: true, status: true },
            },
            analytics: {
                select: { views: true, engagementScore: true },
            },
            _count: {
                select: { applicants: true, teams: true },
            },
        },
    });

    // Compute enriched fields server-side so the card has everything it needs
    const enriched = projects.map(p => {
        // Milestone progress: average of all milestone progress values
        const milestoneProgress =
            p.milestones.length > 0
                ? Math.round(
                    p.milestones.reduce((sum, m) => sum + m.progress, 0) /
                    p.milestones.length
                )
                : null;

        // Urgent = hiring open, has slots, only 1 slot left
        const slotsLeft =
            p.maxMembers !== null ? p.maxMembers - p._count.teams : null;
        const isUrgent =
            p.hiringOpen &&
            p.status === "OPEN" &&
            slotsLeft !== null &&
            slotsLeft <= 1 &&
            slotsLeft > 0;

        // Trending = high applicant count relative to team size
        const isTrending = p._count.applicants >= 5;

        return {
            ...p,
            // Flatten owner fields for the card
            ownerName: p.owner.name ?? p.owner.username,
            ownerImage: p.owner.image,
            ownerUsername: p.owner.username,
            // Team avatars for the stacked avatar UI
            teamAvatars: p.teams.map(t => t.user.image).filter(Boolean) as string[],
            // Computed
            milestoneProgress,
            isUrgent,
            isTrending,
            // Map new field names the card expects
            projectCategory: p.projectType ?? null,
            // Dates as ISO strings for client serialization
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        };
    });

    return NextResponse.json(enriched);
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
// Creates a new project. Optionally creates a linked community group.

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const {
            // Required
            title,
            description,
            difficulty,
            // Identity
            tagline,
            vision,
            problemStatement,
            buildGoal,
            // Classification
            domain,
            projectType,
            phase,
            // Team
            collaborationType,
            maxMembers,
            // Recruitment
            openRoles,       // string[] in new schema
            hiringOpen,
            contributorExpectations,
            contributionGuide,
            // Tech
            techStack,
            plannedFeatures,
            // Settings
            visibility,
            estimatedDuration,
            monetization,
            // Media
            coverImage,
            // Links
            liveUrl,
            repoUrl,
            // Community
            createCommunity,
            communityName,
        } = body;

        // ── Validation ──────────────────────────────────────────────────────

        if (!title?.trim() || !description?.trim() || !difficulty) {
            return NextResponse.json(
                { error: "Title, description, and difficulty are required." },
                { status: 400 }
            );
        }

        if (
            repoUrl &&
            !repoUrl.includes("github.com") &&
            !repoUrl.includes("gitlab.com") &&
            !repoUrl.includes("bitbucket.org")
        ) {
            return NextResponse.json(
                { error: "Repo URL must be a valid GitHub, GitLab, or Bitbucket link." },
                { status: 400 }
            );
        }

        if (liveUrl) {
            try {
                const res = await fetch(liveUrl, {
                    method: "HEAD",
                    signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) {
                    return NextResponse.json(
                        { error: "Project URL is not reachable. Make sure it's live." },
                        { status: 400 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: "Could not reach the project URL. Is it live?" },
                    { status: 400 }
                );
            }
        }

        // ── Normalize arrays ─────────────────────────────────────────────────

        const normalizedTechStack: string[] = (techStack ?? [])
            .map((t: string) => t.toLowerCase().trim())
            .filter(Boolean);

        const normalizedOpenRoles: string[] = (openRoles ?? [])
            .map((r: string) => r.trim())
            .filter(Boolean);

        const normalizedPlannedFeatures: string[] = (plannedFeatures ?? [])
            .map((f: string) => f.trim())
            .filter(Boolean);

        // ── Create project ───────────────────────────────────────────────────

        const project = await prisma.project.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                tagline: tagline?.trim() ?? null,
                vision: vision?.trim() ?? null,
                problemStatement: problemStatement?.trim() ?? null,
                buildGoal: buildGoal?.trim() ?? null,
                createdBy: session.user.id,
                status: "OPEN",
                visibility: visibility ?? "PUBLIC",
                difficulty,
                domain: domain ?? null,
                projectType: projectType ?? null,
                phase: phase ?? "IDEA",
                collaborationType: collaborationType ?? "TEAM",
                maxMembers: maxMembers ? Number(maxMembers) : null,
                openRoles: normalizedOpenRoles,
                hiringOpen: hiringOpen !== false,
                contributorExpectations: contributorExpectations?.trim() ?? null,
                contributionGuide: contributionGuide?.trim() ?? null,
                techStack: normalizedTechStack,
                plannedFeatures: normalizedPlannedFeatures,
                estimatedDuration: estimatedDuration ?? null,
                monetization: monetization ?? null,
                coverImage: coverImage ?? null,
                liveUrl: liveUrl?.trim() ?? null,
                repoUrl: repoUrl?.trim() ?? null,
            },
        });

        // Add creator as OWNER team member
        await prisma.teamMember.create({
            data: {
                projectId: project.id,
                userId: session.user.id,
                role: "owner",
                permissionLevel: "OWNER",
                active: true,
            },
        });

        // Create community group if requested
        if (createCommunity) {
            const group = await prisma.communityGroup.create({
                data: {
                    name: communityName?.trim()
                        ? communityName.trim()
                        : `${title.trim()} Community`,
                    description: `Community for the "${title.trim()}" project`,
                    createdBy: session.user.id,
                    members: {
                        create: {
                            userId: session.user.id,
                            role: "ADMIN",
                            status: "ACTIVE",
                        },
                    },
                },
            });

            await prisma.project.update({
                where: { id: project.id },
                data: { communityGroupId: group.id },
            });
        }

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("PROJECT_CREATE_ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}