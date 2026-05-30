import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WorkspaceShell from "./WorkspaceShell";

export const metadata = { title: "Workspace — Sancodevs" };

export default async function WorkspacePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    // ── Only fetch: counts (for badges) + default tab data ──
    const [counts, createdProjects] = await Promise.all([
        prisma.$transaction([
            prisma.project.count({
                where: { createdBy: userId, status: { not: "ARCHIVED" } },
            }),
            prisma.teamMember.count({
                where: {
                    userId,
                    active: true,
                    project: { createdBy: { not: userId }, status: { not: "ARCHIVED" } },
                },
            }),
            prisma.projectApplication.count({ where: { userId } }),
            prisma.projectTask.count({
                where: { assignedTo: userId, status: { not: "DONE" } },
            }),
            prisma.notification.count({ where: { userId, read: false } }),
            prisma.savedProject.count({ where: { userId } }),
            prisma.project.count({
                where: { createdBy: userId, status: "ARCHIVED" },
            }),
        ]),

        // Default tab: Created — minimal projection, no full relations
        prisma.project.findMany({
            where: { createdBy: userId, status: { not: "ARCHIVED" } },
            select: {
                id: true,
                title: true,
                tagline: true,
                status: true,
                phase: true,
                domain: true,
                hiringOpen: true,
                updatedAt: true,
                _count: {
                    select: {
                        applicants: { where: { status: "PENDING" } },
                        teams: { where: { active: true } },
                        tasks: true,
                    },
                },
                milestones: {
                    where: { status: { not: "COMPLETED" } },
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { id: true, title: true },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
        }),
    ]);

    const [
        createdCount,
        joinedCount,
        applicationsCount,
        activeTaskCount,
        unreadNotifCount,
        savedCount,
        archivedCount,
    ] = counts;

    return (
        <WorkspaceShell
            userId={userId}
            tabCounts={{
                created: createdCount,
                joined: joinedCount,
                applications: applicationsCount,
                tasks: activeTaskCount,
                activity: unreadNotifCount,
                saved: savedCount,
                archived: archivedCount,
            }}
            initialCreatedProjects={createdProjects}
        />
    );
}