import { prisma } from "@/lib/prisma";

export type AchievementEvent =
    | "ONBOARDING_COMPLETED"
    | "TASK_COMPLETED"
    | "PROJECT_JOINED"
    | "PROJECT_CREATED"
    | "FRIEND_ADDED"
    | "MESSAGE_SENT"
    | "APPLICATION_ACCEPTED";

// ─── Evaluator ────────────────────────────────────────────────────────────────

export async function evaluateAchievements(
    userId: string,
    event: AchievementEvent
): Promise<void> {
    try {
        // Fetch everything needed in parallel — one round trip
        const [stats, teams, userAchievements, user] = await Promise.all([
            prisma.userStats.findUnique({
                where: { userId },
                select: {
                    tasksCompleted: true,
                    tasksMissed: true,
                    tasksLate: true,
                    reliabilityScore: true,
                    projectsCompleted: true,
                    onTimeRate: true,
                    totalTaskVolume: true,
                },
            }),
            prisma.teamMember.findMany({
                where: { userId, active: true },
                select: { id: true, permissionLevel: true, joinedAt: true },
            }),
            prisma.userAchievement.findMany({
                where: { userId },
                select: { achievementKey: true },
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    onboarding: { select: { id: true } },
                    _count: {
                        select: {
                            user1Friendships: true,
                            user2Friendships: true,
                            communityMessages: true,
                        },
                    },
                },
            }),
        ]);

        const earned = new Set(userAchievements.map((a) => a.achievementKey));

        // Keys to unlock this evaluation cycle
        const toUnlock: string[] = [];

        function tryUnlock(key: string, condition: boolean) {
            if (!earned.has(key) && condition) {
                toUnlock.push(key);
            }
        }

        const totalTerminal = stats
            ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed
            : 0;

        const friendCount =
            (user?._count?.user1Friendships ?? 0) + (user?._count?.user2Friendships ?? 0);

        const messageCount = user?._count?.communityMessages ?? 0;

        const ownedProjects = teams.filter((t) => t.permissionLevel === "OWNER").length;

        // Teams with 3+ members where user is owner — approximate (owner accepted ≥3 apps)
        // For now we use team count as proxy; full check requires subquery
        const projectTeamCount = teams.length;

        // Long-term: active on project for 90+ days
        const now = Date.now();
        const longTermActive = teams.some(
            (t) => now - new Date(t.joinedAt).getTime() > 90 * 24 * 60 * 60 * 1000
        );

        // ── Evaluate per event ────────────────────────────────────────────────────

        if (event === "ONBOARDING_COMPLETED") {
            tryUnlock("PROFILE_COMPLETED", !!user?.onboarding);
        }

        if (event === "TASK_COMPLETED") {
            tryUnlock("FIRST_TASK", (stats?.tasksCompleted ?? 0) >= 1);
            tryUnlock("TASKS_10", (stats?.tasksCompleted ?? 0) >= 10);
            tryUnlock("TASKS_30", (stats?.tasksCompleted ?? 0) >= 30);
            tryUnlock("TASKS_100", (stats?.tasksCompleted ?? 0) >= 100);
            tryUnlock("ZERO_MISS_STREAK", totalTerminal >= 10 && (stats?.tasksMissed ?? 0) === 0 && (stats?.tasksLate ?? 0) === 0);
            tryUnlock("DEADLINE_CRUSHER", (stats?.onTimeRate ?? 0) >= 0.9 && (stats?.totalTaskVolume ?? 0) >= 20);
            tryUnlock("RELIABLE_BUILDER", (stats?.reliabilityScore ?? 0) >= 85 && (stats?.totalTaskVolume ?? 0) >= 15);
            tryUnlock("HIGH_TRUST_BUILDER", (stats?.reliabilityScore ?? 0) >= 95 && (stats?.totalTaskVolume ?? 0) >= 25);
        }

        if (event === "PROJECT_JOINED") {
            tryUnlock("FIRST_PROJECT", projectTeamCount >= 1);
            tryUnlock("JOINED_5_PROJECTS", projectTeamCount >= 5);
            tryUnlock("LONG_TERM_CONTRIBUTOR", longTermActive);
        }

        if (event === "PROJECT_CREATED") {
            tryUnlock("PROJECT_OWNER", ownedProjects >= 1);
        }

        if (event === "APPLICATION_ACCEPTED") {
            tryUnlock("BUILT_FIRST_TEAM", ownedProjects >= 1); // refined: counts accepted apps separately in future
        }

        if (event === "FRIEND_ADDED") {
            tryUnlock("FIRST_FRIEND", friendCount >= 1);
        }

        if (event === "MESSAGE_SENT") {
            tryUnlock("FIRST_POST", messageCount >= 1);
        }

        // ── Write unlocks — idempotent via skipDuplicates ─────────────────────────
        if (toUnlock.length > 0) {
            await prisma.userAchievement.createMany({
                data: toUnlock.map((key) => ({ userId, achievementKey: key })),
                skipDuplicates: true,
            });
        }
    } catch (err) {
        // Achievement evaluation should never block the main action
        console.error("[evaluateAchievements]", err);
    }
}