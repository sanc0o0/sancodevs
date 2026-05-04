import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getReliabilityTier } from "@/lib/scoring";
import Link from "next/link";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            stats: true,
            onboarding: true,
            teams: {
                include: {
                    project: { select: { id: true, title: true, status: true } },
                },
                orderBy: { id: "desc" },
                take: 6,
            },
            assignedTasks: {
                where: { status: { in: ["TODO", "IN_PROGRESS", "SUBMITTED"] } },
                include: { project: { select: { id: true, title: true } } },
                orderBy: { dueDate: "asc" },
                take: 5,
            },
        },
    });

    if (!user) redirect("/login");

    const stats = user.stats;
    const tier = stats ? getReliabilityTier(stats.reliabilityScore) : getReliabilityTier(100);
    const totalTerminal = stats
        ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected
        : 0;

    // Circumference for the ring SVG
    const RING_R = 44;
    const RING_C = 2 * Math.PI * RING_R;
    const score = stats?.reliabilityScore ?? 100;
    const ringOffset = RING_C - (score / 100) * RING_C;

    return (
        <div className="w-full max-w-3xl mx-auto p-5 md:p-8 flex flex-col gap-6">

            {/* ── Identity card ── */}
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="w-14 h-14 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {user.image
                        ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-lg font-semibold text-[var(--text)]">{user.name?.charAt(0)}</span>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-[var(--text)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                    {user.onboarding && (
                        <p className="text-[10px] text-[var(--muted)] mt-1 uppercase tracking-wider">
                            {user.onboarding.userCategory} · {user.onboarding.skills.slice(0, 3).join(", ")}
                        </p>
                    )}
                </div>
                <Link
                    href="/settings"
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] no-underline transition-colors flex-shrink-0"
                >
                    Settings
                </Link>
            </div>

            {/* ── Reliability score — the main metric ── */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-4">Reliability Score</p>

                <div className="flex items-center gap-6 flex-wrap">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                        <svg width="110" height="110" viewBox="0 0 110 110">
                            {/* Track */}
                            <circle
                                cx="55" cy="55" r={RING_R}
                                fill="none"
                                stroke="var(--surface2)"
                                strokeWidth="8"
                            />
                            {/* Score arc */}
                            <circle
                                cx="55" cy="55" r={RING_R}
                                fill="none"
                                stroke={tier.color}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={RING_C}
                                strokeDashoffset={ringOffset}
                                transform="rotate(-90 55 55)"
                                style={{ transition: "stroke-dashoffset 0.6s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-[var(--text)]">{score}</span>
                            <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider">/ 100</span>
                        </div>
                    </div>

                    {/* Tier info */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div>
                            <span className="text-sm font-semibold" style={{ color: tier.color }}>{tier.label}</span>
                            <p className="text-xs text-[var(--muted)] mt-0.5">{tier.description}</p>
                        </div>

                        {/* Signals */}
                        {totalTerminal === 0 ? (
                            <p className="text-xs text-[var(--muted)] italic">No tasks completed yet — score will update as you work.</p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {stats && stats.tasksMissed >= 3 && (
                                    <Signal type="warn" text={`Missed ${stats.tasksMissed} deadlines`} />
                                )}
                                {stats && stats.tasksRejected >= 2 && (
                                    <Signal type="warn" text={`${stats.tasksRejected} tasks rejected`} />
                                )}
                                {stats && stats.onTimeRate >= 90 && totalTerminal >= 3 && (
                                    <Signal type="good" text="Strong on-time track record" />
                                )}
                                {stats && stats.reliabilityScore >= 85 && totalTerminal >= 5 && (
                                    <Signal type="good" text="Top performer — highly reliable" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="Completed"
                    value={stats?.tasksCompleted ?? 0}
                    sub="on time"
                    color="#22c55e"
                />
                <StatCard
                    label="Late"
                    value={stats?.tasksLate ?? 0}
                    sub="past deadline"
                    color="#fb923c"
                />
                <StatCard
                    label="Missed"
                    value={stats?.tasksMissed ?? 0}
                    sub="no submission"
                    color="#ef4444"
                />
                <StatCard
                    label="Rejected"
                    value={stats?.tasksRejected ?? 0}
                    sub="quality fail"
                    color="#f59e0b"
                />
            </div>

            {/* ── Rate bars ── */}
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-4">
                <RateBar
                    label="On-time rate"
                    value={stats?.onTimeRate ?? 100}
                    color="#22c55e"
                    tip="Percentage of tasks submitted before their deadline"
                />
                <RateBar
                    label="Reliability score"
                    value={stats?.reliabilityScore ?? 100}
                    color={tier.color}
                    tip="Weighted across all outcomes — on-time, late, missed, rejected"
                />
                {totalTerminal > 0 && (
                    <RateBar
                        label="Completion rate"
                        value={parseFloat(((
                            (stats?.tasksCompleted ?? 0) + (stats?.tasksLate ?? 0)
                        ) / totalTerminal * 100).toFixed(1))}
                        color="#60a5fa"
                        tip="Tasks that reached DONE or LATE (submitted, regardless of timing)"
                    />
                )}
            </div>

            {/* ── Active tasks ── */}
            {user.assignedTasks.length > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-medium text-[var(--text)] mb-3 uppercase tracking-wider">Active tasks</p>
                    <div className="flex flex-col gap-2">
                        {user.assignedTasks.map(task => {
                            const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                            return (
                                <Link
                                    key={task.id}
                                    href={`/projects/${task.projectId}/board`}
                                    className="flex items-center gap-3 py-2 px-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] no-underline transition-colors"
                                >
                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0 ${task.status === "SUBMITTED" ? "bg-amber-500/10 text-amber-400" :
                                            task.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
                                                "bg-[var(--surface2)] text-[var(--muted)]"
                                        }`}>{task.status.replace("_", " ")}</span>
                                    <span className="text-xs text-[var(--text)] flex-1 truncate">{task.title}</span>
                                    <span className="text-xs text-[var(--muted)] flex-shrink-0 truncate max-w-[100px]">{task.project.title}</span>
                                    {task.dueDate && (
                                        <span className={`text-[10px] flex-shrink-0 ${overdue ? "text-red-400 font-medium" : "text-[var(--muted)]"}`}>
                                            {overdue ? "⚠ " : ""}{new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Projects ── */}
            {user.teams.length > 0 && (
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-medium text-[var(--text)] mb-3 uppercase tracking-wider">Projects</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {user.teams.map(t => {
                            const STATUS_COLORS: Record<string, string> = {
                                OPEN: "#22c55e", IN_PROGRESS: "#378ADD", CLOSED: "#666",
                                COMPLETED: "#639922", TERMINATED: "#e24b4a",
                            };
                            return (
                                <Link
                                    key={t.id}
                                    href={`/projects/${t.project.id}`}
                                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl border border-[var(--border)] hover:border-[var(--muted)] no-underline transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[var(--text)] truncate">{t.project.title}</p>
                                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{t.role}</p>
                                    </div>
                                    <span className="text-[9px] font-medium flex-shrink-0 uppercase" style={{ color: STATUS_COLORS[t.project.status] ?? "#666" }}>
                                        {t.project.status}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Empty state ── */}
            {user.teams.length === 0 && user.assignedTasks.length === 0 && (
                <div className="py-12 rounded-2xl border border-[var(--border)] border-dashed flex flex-col items-center gap-3">
                    <p className="text-sm text-[var(--muted)]">No project activity yet</p>
                    <Link href="/projects" className="text-xs text-[var(--accent)] no-underline hover:underline">
                        Browse projects →
                    </Link>
                </div>
            )}

        </div>
    );
}

/* ── Sub-components ── */

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
    return (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-1">
            <span className="text-2xl font-bold" style={{ color: value === 0 ? "var(--muted)" : color }}>
                {value}
            </span>
            <span className="text-xs font-medium text-[var(--text)]">{label}</span>
            <span className="text-[10px] text-[var(--muted)]">{sub}</span>
        </div>
    );
}

function RateBar({ label, value, color, tip }: { label: string; value: number; color: string; tip: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[var(--text)]">{label}</span>
                <span className="text-xs font-semibold" style={{ color }}>{value}%</span>
            </div>
            <div className="h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden" title={tip}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: color }}
                />
            </div>
        </div>
    );
}

function Signal({ type, text }: { type: "good" | "warn"; text: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${type === "good" ? "text-green-400" : "text-amber-400"}`}>
                {type === "good" ? "✓" : "⚠"}
            </span>
            <span className="text-[11px] text-[var(--muted)]">{text}</span>
        </div>
    );
}