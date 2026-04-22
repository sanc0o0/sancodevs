import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddFriendButton from "./AddFriendButton";
import ProfileTabs from "./ProfileTabs";
import BlockButton from "./BlockButton";

export default async function UserProfilePage({
    params,
}: { params: Promise<{ userId: string }> }) {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Block check — if viewer blocked by this user, show limited view
    let isBlockedByThem = false;
    let hasBlockedThem = false;

    if (session?.user?.id && session.user.id !== userId) {
        const [blockedByThem, blockedThem] = await Promise.all([
            prisma.block.findUnique({
                where: { blockerId_blockedId: { blockerId: userId, blockedId: session.user.id } },
            }),
            prisma.block.findUnique({
                where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: userId } },
            }),
        ]);
        isBlockedByThem = !!blockedByThem;
        hasBlockedThem = !!blockedThem;
    }

    const user = await prisma.user.findUnique({
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
                include: { project: { select: { id: true, title: true, status: true, techStack: true } } },
                take: 10,
            },
        },
    });

    if (!user) notFound();

    const isOwnProfile = session?.user?.id === userId;

    if ((isBlockedByThem || hasBlockedThem) && !isOwnProfile) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text)] mb-2">Profile not available</p>
                <p className="text-xs text-[var(--muted)]">
                    {hasBlockedThem ? "You have blocked this user." : "This profile isn't accessible."}
                </p>
                {hasBlockedThem && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                        You can unblock them in{" "}
                        <a href="/settings" className="text-[var(--accent)] no-underline hover:underline">Settings → Privacy</a>
                    </p>
                )}
                <Link href="/community" className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--accent)] no-underline hover:opacity-70 transition-opacity">
                    ← Back
                </Link>
            </div>
        );
    }

    // Stats
    const [totalProjects, activeGroups, tasksCompleted, totalTasks, friendCount] = await Promise.all([
        prisma.teamMember.count({ where: { userId } }),
        prisma.communityMember.count({ where: { userId, status: "ACTIVE" } }),
        prisma.projectTask.count({ where: { assignedTo: userId, status: "DONE" } }),
        prisma.projectTask.count({ where: { assignedTo: userId } }),
        prisma.friendship.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    const categoryLabel: Record<string, string> = {
        BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", BUILDER: "Expert",
    };
    const categoryColor: Record<string, string> = {
        BEGINNER: "bg-blue-400/10 text-blue-400 border-blue-400/30",
        INTERMEDIATE: "bg-amber-400/10 text-amber-400 border-amber-400/30",
        BUILDER: "bg-green-400/10 text-green-400 border-green-400/30",
    };

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    const category = user.onboarding?.userCategory ?? "BEGINNER";
    const publicGroups = user.communityMembers.filter(m => !m.group.isPrivate);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Back */}
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] mb-5 no-underline transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
            </Link>

            {/* Hero */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] mb-4">
                <div className="flex items-start gap-4">
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
                    {/* Action buttons */}
                    {!isOwnProfile && session && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            {!hasBlockedThem && <AddFriendButton targetUserId={userId} />}
                            <BlockButton targetUserId={userId} isBlocked={hasBlockedThem} />
                        </div>
                    )}
                    {isOwnProfile && (
                        <Link href="/settings" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] no-underline hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors">
                            Edit profile
                        </Link>
                    )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                    {[
                        { label: "Projects", value: totalProjects },
                        { label: "Groups", value: activeGroups },
                        { label: "Friends", value: friendCount },
                        { label: "Done", value: `${completionRate}%` },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-lg font-semibold text-[var(--text)]">{s.value}</p>
                            <p className="text-[10px] text-[var(--muted)]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Task completion bar */}
                {totalTasks > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[var(--muted)]">Task completion</span>
                            <span className="text-[10px] font-medium text-[var(--text)]">{tasksCompleted}/{totalTasks}</span>
                        </div>
                        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${completionRate}%`,
                                    background: completionRate >= 70 ? "#22c55e" : completionRate >= 40 ? "#f59e0b" : "#ef4444",
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tabbed content */}
            <ProfileTabs
                skills={user.onboarding?.skills ?? []}
                projects={user.teams.map(t => t.project)}
                publicGroups={publicGroups.map(m => m.group)}
                isOwnProfile={isOwnProfile}
                userId={userId}
            />
        </div>
    );
}
