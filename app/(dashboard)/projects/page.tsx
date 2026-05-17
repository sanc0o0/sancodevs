import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // ── Fetch projects with full enrichment ──────────────────────────────────
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
                    userId: true,
                    user: { select: { image: true, username: true } },
                },
                take: 5,
            },
            milestones: {
                select: { progress: true, status: true },
            },
            _count: {
                select: { applicants: true, teams: true },
            },
        },
    });

    // ── Fetch current user's membership + pending applications ───────────────
    const [memberProjects, pendingApplications] = await Promise.all([
        prisma.teamMember.findMany({
            where: { userId: session.user.id, active: true },
            select: { projectId: true },
        }),
        prisma.projectApplication.findMany({
            where: { userId: session.user.id, status: "PENDING" },
            select: { projectId: true },
        }),
    ]);

    const memberProjectIds = memberProjects.map(m => m.projectId);
    const pendingProjectIds = pendingApplications.map(a => a.projectId);

    // ── Serialize and enrich ─────────────────────────────────────────────────
    const serialized = projects.map(p => {
        const milestoneProgress =
            p.milestones.length > 0
                ? Math.round(
                    p.milestones.reduce((sum, m) => sum + m.progress, 0) /
                    p.milestones.length
                )
                : null;

        const slotsLeft =
            p.maxMembers !== null ? p.maxMembers - p._count.teams : null;
        const isUrgent =
            p.hiringOpen &&
            p.status === "OPEN" &&
            slotsLeft !== null &&
            slotsLeft <= 1 &&
            slotsLeft > 0;

        const isTrending = p._count.applicants >= 5;

        return {
            id: p.id,
            title: p.title,
            description: p.description,
            tagline: p.tagline,
            status: p.status,
            visibility: p.visibility,
            difficulty: p.difficulty,
            techStack: p.techStack,
            projectType: p.projectType,
            domain: p.domain,
            buildGoal: p.buildGoal,
            estimatedDuration: p.estimatedDuration,
            collaborationType: p.collaborationType,
            monetization: p.monetization,
            openRoles: p.openRoles,
            maxMembers: p.maxMembers,
            hiringOpen: p.hiringOpen,
            phase: p.phase,
            accentColor: p.accentColor,
            coverImage: p.coverImage,
            liveUrl: p.liveUrl,
            repoUrl: p.repoUrl,
            createdBy: p.createdBy,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            _count: p._count,
            // Enriched
            ownerName: p.owner.name ?? p.owner.username,
            ownerImage: p.owner.image,
            ownerUsername: p.owner.username,
            teamAvatars: p.teams.map(t => t.user.image).filter(Boolean) as string[],
            milestoneProgress,
            isUrgent,
            isTrending,
            projectCategory: p.projectType ?? null,
        };
    });

    return (
        <ProjectsClient
            initialProjects={serialized}
            currentUserId={session.user.id}
            memberProjectIds={memberProjectIds}
            pendingProjectIds={pendingProjectIds}
        />
    );
}