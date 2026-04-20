import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddFriendButton from "./AddFriendButton";

export default async function UserProfilePage({
    params,
}: { params: Promise<{ userId: string }> }) {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    const [user, stats] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, image: true, createdAt: true,
                onboarding: { select: { skills: true, goal: true, userCategory: true } },
                communityMembers: {
                    where: { status: "ACTIVE" },
                    include: { group: { select: { id: true, name: true, isPrivate: true } } },
                    take: 8,
                },
                teams: {
                    include: { project: { select: { id: true, title: true, status: true } } },
                    take: 6,
                },
            },
        }),
        Promise.all([
            prisma.teamMember.count({ where: { userId } }),
            prisma.communityMember.count({ where: { userId, status: "ACTIVE" } }),
            prisma.projectTask.count({ where: { assignedTo: userId, status: "DONE" } }),
            prisma.projectTask.count({ where: { assignedTo: userId } }),
            prisma.friendship.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
        ]).then(([totalProjects, activeGroups, tasksCompleted, totalTasks, friendCount]) => ({
            totalProjects, activeGroups, tasksCompleted, totalTasks,
            completionRate: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0,
            friendCount,
        })),
    ]);

    if (!user) notFound();

    const isOwnProfile = session?.user?.id === userId;

    const categoryLabel: Record<string, string> = {
        BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", BUILDER: "Expert",
    };
    const categoryColor: Record<string, string> = {
        BEGINNER: "text-blue-400 border-blue-400/30 bg-blue-400/10",
        INTERMEDIATE: "text-amber-400 border-amber-400/30 bg-amber-400/10",
        BUILDER: "text-green-400 border-green-400/30 bg-green-400/10",
    };

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    const category = user.onboarding?.userCategory ?? "BEGINNER";
    const publicGroups = user.communityMembers.filter(m => !m.group.isPrivate);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] mb-6 no-underline transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
            </Link>

            {/* Identity header */}
            <div className="flex items-center gap-4 mb-5 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ${getColor(user.name ?? "?")}`}>
                    {user.image
                        ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                        : user.name?.charAt(0).toUpperCase()
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-base font-semibold text-[var(--text)]">{user.name}</h1>
                        {user.onboarding?.userCategory && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryColor[category]}`}>
                                {categoryLabel[category]}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                        Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    {user.onboarding?.goal && (
                        <p className="text-xs text-[var(--muted)] mt-0.5 truncate">Goal: {user.onboarding.goal}</p>
                    )}
                </div>
                {!isOwnProfile && session && (
                    <AddFriendButton targetUserId={userId} />
                )}
            </div>

            {/* Trust metrics */}
            <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
                {[
                    { label: "Projects", value: stats.totalProjects },
                    { label: "Groups", value: stats.activeGroups },
                    { label: "Tasks Done", value: stats.tasksCompleted },
                    { label: "Friends", value: stats.friendCount },
                ].map(m => (
                    <div key={m.label} className="flex flex-col items-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <p className="text-xl font-semibold text-[var(--text)]">{m.value}</p>
                        <p className="text-[10px] text-[var(--muted)] mt-0.5">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Completion rate bar */}
            {stats.totalTasks > 0 && (
                <div className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-[var(--text)]">Task completion rate</p>
                        <span className="text-xs font-semibold text-[var(--text)]">{stats.completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${stats.completionRate}%`,
                                background: stats.completionRate >= 70 ? "#22c55e" : stats.completionRate >= 40 ? "#f59e0b" : "#ef4444",
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-1.5">
                        {stats.tasksCompleted} of {stats.totalTasks} tasks completed
                    </p>
                </div>
            )}

            {/* Skills */}
            {user.onboarding?.skills && user.onboarding.skills.length > 0 && (
                <section className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                        {user.onboarding.skills.map(s => (
                            <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)]">
                                {s}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {user.teams.length > 0 && (
                <section className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-3">Projects</p>
                    <div className="flex flex-col gap-1.5">
                        {user.teams.map(t => (
                            <Link
                                key={t.id}
                                href={`/projects/${t.project.id}`}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--surface2)] transition-colors no-underline"
                            >
                                <p className="text-sm text-[var(--text)] font-medium truncate">{t.project.title}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-medium
                                    ${t.project.status === "OPEN" ? "bg-green-500/10 text-green-400" :
                                        t.project.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
                                            "bg-[var(--surface2)] text-[var(--muted)]"}`}>
                                    {t.project.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Public groups */}
            {publicGroups.length > 0 && (
                <section className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-3">Active in</p>
                    <div className="flex flex-wrap gap-2">
                        {publicGroups.map(m => (
                            <span key={m.group.id} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--muted)]">
                                {m.group.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {!user.onboarding && !user.teams.length && !publicGroups.length && (
                <p className="text-sm text-[var(--muted)] text-center py-12">This user hasn&apos;t set up their profile yet.</p>
            )}
        </div>
    );
}