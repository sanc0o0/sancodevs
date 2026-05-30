import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ProfileShell from "@/components/profile/layout/ProfileShell";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId: rawParam } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    // ── Viewer: always by email (OAuth safety) ────────────────────────────────
    const viewer = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!viewer) redirect("/login");

    // ── Resolve subject ───────────────────────────────────────────────────────
    const cleanParam = rawParam.startsWith("@") ? rawParam.slice(1) : rawParam;
    const isUuid = UUID_RE.test(cleanParam);

    const subject = await prisma.user.findUnique({
        where: isUuid ? { id: cleanParam } : { username: cleanParam },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            image: true,
            bannerImage: true,
            bio: true,
            stats: true,
            onboarding: true,
            preferences: true,
            teams: {
                where: { active: true },
                include: {
                    project: { select: { id: true, title: true, status: true } },
                },
                orderBy: { joinedAt: "desc" },
                take: 10,
            },
        },
    });

    if (!subject) notFound();

    // UUID → canonical /user/username redirect
    if (isUuid && subject.username) redirect(`/user/${subject.username}`);

    // Strip @ from URL
    if (rawParam.startsWith("@")) redirect(`/user/${subject.username}`);

    const isOwner = subject.id === viewer.id;

    // ── Block check ───────────────────────────────────────────────────────────
    let viewerHasBlocked = false;
    let subjectHasBlockedViewer = false;

    if (!isOwner) {
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewer.id, blockedId: subject.id },
                    { blockerId: subject.id, blockedId: viewer.id },
                ],
            },
            select: { blockerId: true },
        });
        viewerHasBlocked = block?.blockerId === viewer.id;
        subjectHasBlockedViewer = block?.blockerId === subject.id;
    }

    // If the subject has blocked the viewer, treat as not found (don't reveal existence)
    if (subjectHasBlockedViewer) notFound();

    // ── Build minimal identity payload ────────────────────────────────────────
    const ob = subject.onboarding;
    const stats = subject.stats;

    const AVAIL_LABELS: Record<string, string> = {
        WEEKEND: "Weekends only",
        LIGHT: "Light — 1–2 hrs/day",
        MODERATE: "Moderate — 3–5 hrs/day",
        FULLTIME: "Full-time",
    };

    const MISSION_LABELS: Record<string, string> = {
        JOIN_PROJECT: "Looking to join projects",
        START_PROJECT: "Building my own project",
        FIND_TEAM: "Finding a team",
    };

    const identity = {
        // Core
        subjectId: subject.id,
        viewerId: viewer.id,
        isOwner,
        viewerHasBlocked,

        // Profile card props (passed through directly)
        name: subject.name ?? "Builder",
        username: subject.username,
        email: subject.email,
        image: subject.image,
        bannerImage: subject.bannerImage ?? null,
        bio: subject.bio ?? null,
        reliabilityScore: stats?.reliabilityScore ?? null,
        builderScore: ob?.builderScore ?? 0,

        // Onboarding-derived labels
        role: ob?.role?.replace(/_/g, " ") ?? null,
        domain: ob?.domain?.replace(/_/g, " ") ?? null,
        experienceLevel: ob?.experienceLevel ?? null,
        availability: ob?.availability ? (AVAIL_LABELS[ob.availability] ?? ob.availability) : null,
        mission: ob?.mission ? (MISSION_LABELS[ob.mission] ?? ob.mission) : null,
        goals: ob?.goals ?? [],

        // Preferences
        prefTechs: subject.preferences?.prefTechs ?? [],
        prefTopics: subject.preferences?.prefTopics ?? [],

        // Active projects for ProfileCard
        cardProjects: subject.teams.map((t) => ({
            id: t.project.id,
            title: t.project.title,
            status: t.project.status,
            role: t.role,
        })),

        // Achievements derived from stats
        totalTerminal: stats
            ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected
            : 0,
        stats: stats
            ? {
                tasksCompleted: stats.tasksCompleted,
                tasksMissed: stats.tasksMissed,
            }
            : null,
        teamCount: subject.teams.length,
    };

    return <ProfileShell identity={identity} />;
}