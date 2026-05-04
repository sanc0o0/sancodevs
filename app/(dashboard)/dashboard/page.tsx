import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getReliabilityTier } from "@/lib/scoring";
import { PATHS } from "@/lib/path";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const [user, activeTasks, recentNotifications] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                stats: true,
                onboarding: true,
                teams: {
                    include: { project: { select: { id: true, title: true, status: true } } },
                    orderBy: { id: "desc" },
                    take: 4,
                },
            },
        }),
        prisma.projectTask.findMany({
            where: { assignedTo: session.user.id, status: { in: ["TODO", "IN_PROGRESS", "SUBMITTED"] } },
            include: { project: { select: { id: true, title: true } } },
            orderBy: { dueDate: "asc" },
            take: 8,
        }),
        prisma.notification.findMany({
            where: { userId: session.user.id, read: false },
            orderBy: { createdAt: "desc" },
            take: 4,
        }),
    ]);

    if (!user) redirect("/login");

    // Learn progress
    let learn: { completedCount: number; total: number; pathLabel: string; pathId: string; nextIdx: number } | null = null;
    if (user.onboarding) {
        const progress = await prisma.userProgress.findMany({
            where: { userId: session.user.id, pathId: user.onboarding.pathId },
        });
        const path = PATHS[user.onboarding.pathId];
        if (path) {
            learn = {
                completedCount: progress.length,
                total: path.modules.length,
                pathLabel: path.label,
                pathId: user.onboarding.pathId,
                nextIdx: Math.min(progress.length, path.modules.length - 1),
            };
        }
    }

    const stats = user.stats;
    const tier = stats ? getReliabilityTier(stats.reliabilityScore) : getReliabilityTier(100);
    const totalTerminal = stats ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected : 0;
    const overdueCount = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "SUBMITTED").length;

    const firstName = user.name?.split(" ")[0] ?? "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const PROJECT_STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e", IN_PROGRESS: "#378ADD", CLOSED: "#666",
        COMPLETED: "#639922", TERMINATED: "#e24b4a",
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-5 md:p-8 flex flex-col gap-6">

            {/* Greeting */}
            <div>
                <p className="text-xs text-[var(--muted)] mb-0.5">{greeting}</p>
                <h1 className="text-xl font-semibold text-[var(--text)]">{firstName}</h1>
                {overdueCount > 0 && (
                    <p className="text-xs text-red-400 mt-1.5">
                        ⚠ {overdueCount === 1 ? "1 overdue task" : `${overdueCount} overdue tasks`}
                    </p>
                )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStat label="Reliability" value={`${stats?.reliabilityScore ?? 100}`} unit="%" color={tier.color} sub={tier.label} href="/profile" />
                <QuickStat label="On-time rate" value={`${stats?.onTimeRate ?? 100}`} unit="%" color="#60a5fa" sub={totalTerminal > 0 ? `${totalTerminal} tasks total` : "No data yet"} />
                <QuickStat label="Active tasks" value={String(activeTasks.length)} unit="" color={activeTasks.length > 4 ? "#fb923c" : "var(--text)"} sub={`${activeTasks.filter(t => t.status === "SUBMITTED").length} awaiting review`} />
                <QuickStat label="Projects" value={String(user.teams.length)} unit="" color="var(--text)" sub="active memberships" />
            </div>

            {/* Main 2-column layout */}
            <div className="flex flex-col md:flex-row gap-5 items-start">

                {/* LEFT — tasks + projects */}
                <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">

                    {/* Tasks */}
                    {activeTasks.length > 0 ? (
                        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-xs font-medium text-[var(--text)] uppercase tracking-wider mb-3">Your tasks</p>
                            <div className="flex flex-col gap-1.5">
                                {activeTasks.map(task => {
                                    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "SUBMITTED";
                                    const dueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
                                    return (
                                        <Link key={task.id} href={`/projects/${task.projectId}/board`}
                                            className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] no-underline transition-colors">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === "SUBMITTED" ? "bg-amber-400" :
                                                    task.status === "IN_PROGRESS" ? "bg-blue-400" :
                                                        overdue ? "bg-red-400" : "bg-[var(--muted)]"
                                                }`} />
                                            <span className="text-xs text-[var(--text)] flex-1 truncate">{task.title}</span>
                                            <span className="text-[10px] text-[var(--muted)] truncate max-w-[90px] flex-shrink-0 hidden md:block">
                                                {task.project.title}
                                            </span>
                                            {task.dueDate ? (
                                                <span className={`text-[10px] flex-shrink-0 font-medium ${overdue ? "text-red-400" : dueToday ? "text-amber-400" : "text-[var(--muted)]"}`}>
                                                    {overdue ? "⚠ Overdue" : dueToday ? "Due today" : new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{task.status.replace("_", " ")}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center gap-2">
                            <p className="text-sm text-[var(--muted)]">No active tasks</p>
                            <Link href="/projects" className="text-xs text-[var(--accent)] no-underline hover:underline">Browse projects →</Link>
                        </div>
                    )}

                    {/* Projects */}
                    {user.teams.length > 0 && (
                        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium text-[var(--text)] uppercase tracking-wider">Your projects</p>
                                <Link href="/projects" className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] no-underline">All projects →</Link>
                            </div>
                            <div className="flex flex-col gap-2">
                                {user.teams.map(t => (
                                    <Link key={t.id} href={`/projects/${t.project.id}`}
                                        className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] no-underline transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[var(--text)] truncate">{t.project.title}</p>
                                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{t.role}</p>
                                        </div>
                                        <span className="text-[9px] font-semibold flex-shrink-0 uppercase"
                                            style={{ color: PROJECT_STATUS_COLORS[t.project.status] ?? "#666" }}>
                                            {t.project.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — learn + notifications */}
                <div className="flex flex-col gap-4 w-full md:w-56 md:flex-shrink-0">

                    {/* Learn progress card */}
                    {learn && (
                        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-[var(--text)]">Learn</p>
                                <Link href="/learn" className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] no-underline">View →</Link>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-[var(--surface2)] rounded-full overflow-hidden mb-2.5">
                                <div
                                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                                    style={{ width: `${Math.round(learn.completedCount / learn.total * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-[var(--muted)] mb-1 truncate">{learn.pathLabel}</p>
                            <p className="text-[10px] text-[var(--muted)] mb-3">
                                {learn.completedCount} / {learn.total} modules
                                <span className="ml-1.5">· {Math.round(learn.completedCount / learn.total * 100)}%</span>
                            </p>

                            {learn.completedCount < learn.total ? (
                                <Link
                                    href={`/learn/${learn.pathId}-${learn.nextIdx}`}
                                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] no-underline hover:opacity-85 transition-opacity"
                                >
                                    <span>Module {learn.completedCount + 1}</span>
                                    <span>→</span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-green-400 border border-green-500/20 bg-green-500/5">
                                    <span>✓</span><span>Path complete!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notifications */}
                    {recentNotifications.length > 0 && (
                        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium text-[var(--text)]">Recent</p>
                                <Link href="/notifications" className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] no-underline">All →</Link>
                            </div>
                            <div className="flex flex-col gap-2">
                                {recentNotifications.map(n => (
                                    <Link key={n.id} href={n.href ?? "/notifications"}
                                        className="flex items-start gap-2 py-1 no-underline group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">{n.title}</p>
                                            <p className="text-[10px] text-[var(--muted)] line-clamp-1 mt-0.5">{n.body}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fallback if right col is empty */}
                    {!learn && recentNotifications.length === 0 && (
                        <div className="p-4 rounded-2xl border border-dashed border-[var(--border)] text-center">
                            <p className="text-xs text-[var(--muted)] mb-2">No learning path yet</p>
                            <Link href="/learn" className="text-xs text-[var(--accent)] no-underline hover:underline">Start learning →</Link>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

function QuickStat({ label, value, unit, color, sub, href }: {
    label: string; value: string; unit: string; color: string; sub: string; href?: string;
}) {
    const inner = (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-1 hover:border-[var(--muted)] transition-colors h-full">
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>
                {value}<span className="text-xs font-normal ml-0.5 text-[var(--muted)]">{unit}</span>
            </p>
            <p className="text-[10px] text-[var(--muted)]">{sub}</p>
        </div>
    );
    if (href) return <Link href={href} className="no-underline">{inner}</Link>;
    return inner;
}