// components/profile/overview/OverviewTab.tsx
//
// Overview tab — a profile dashboard.
// Shows lightweight previews of each section.
// Every preview is clickable → navigates to its full tab.
// Fetches from /api/users/:id/overview (lightweight, no full datasets).

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { OverviewSkeleton } from "@/components/profile/shared/ProfileSkeleton";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
    stats: {
        tasksCompleted: number;
        tasksMissed: number;
        tasksLate: number;
        reliabilityScore: number | null;
        projectsCompleted: number;
        onTimeRate: number | null;
    } | null;
    recentProjects: Array<{
        id: string;
        title: string;
        status: string;
        domain: string | null;
        role: string;
    }>;
    activeTasks: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
        dueDate: string | null;
        projectId: string;
        projectTitle: string;
    }>;
    recentReliabilityEvents: Array<{
        id: string;
        eventType: string;
        scoreDelta: number;
        taskTitle: string | null;
        projectLabel: string | null;
        occurredAt: string;
    }>;
    isOwner: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e",
    IN_PROGRESS: "#378ADD",
    ACTIVE: "#378ADD",
    PAUSED: "#facc15",
    CLOSED: "#666",
    COMPLETED: "#86efac",
    TERMINATED: "#e24b4a",
    ARCHIVED: "#666",
    BUILDING: "#a78bfa",
};

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: "#e24b4a",
    HIGH: "#fb923c",
    MEDIUM: "#facc15",
    LOW: "#666",
};

const EVENT_COLORS: Record<string, string> = {
    COMPLETED: "#22c55e",
    LATE: "#facc15",
    MISSED: "#e24b4a",
    REJECTED: "#ef4444",
    REVIEWED: "#378ADD",
};

// ─── Section preview card ─────────────────────────────────────────────────────

function PreviewCard({
    label,
    tab,
    children,
    empty,
    username,
}: {
    label: string;
    tab: string;
    children: React.ReactNode;
    empty?: boolean;
    username: string;
}) {
    const router = useRouter();
    const pathname = usePathname();

    function navigate() {
        router.push(`${pathname}?tab=${tab}`, { scroll: false });
    }

    return (
        <div
            onClick={navigate}
            style={{
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
            {/* Header */}
            <div
                style={{
                    padding: "11px 16px",
                    borderBottom: "0.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <p
                    style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin: 0,
                    }}
                >
                    {label}
                </p>
                <span
                    style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    View all
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </span>
            </div>

            {/* Content */}
            <div style={{ padding: "14px 16px" }}>
                {empty ? (
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>
                        No data yet.
                    </p>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
    value,
    label,
    color,
}: {
    value: string | number;
    label: string;
    color?: string;
}) {
    return (
        <div
            style={{
                flex: 1,
                padding: "12px 10px",
                borderRadius: 10,
                border: "0.5px solid var(--border)",
                background: "var(--surface2)",
                textAlign: "center",
            }}
        >
            <p
                style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: color ?? "var(--text)",
                    margin: 0,
                    lineHeight: 1,
                }}
            >
                {value}
            </p>
            <p
                style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginTop: 4,
                }}
            >
                {label}
            </p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function OverviewTab({ subjectId, isOwner, username }: OverviewTabProps) {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchOverview() {
            setLoading(true);
            setError(false);
            try {
                const r = await fetch(`/api/users/${subjectId}/overview`, {
                    signal: controller.signal,
                });
                if (!r.ok) throw new Error("Failed");
                const d = await r.json();
                setData(d);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchOverview();
        return () => controller.abort();
    }, [subjectId]);

    if (loading) return <OverviewSkeleton />;

    if (error) {
        return (
            <div
                style={{
                    padding: "32px 20px",
                    borderRadius: 10,
                    border: "0.5px solid var(--border)",
                    background: "var(--surface)",
                    textAlign: "center",
                }}
            >
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                    Failed to load overview.{" "}
                    <button
                        onClick={() => window.location.reload()}
                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}
                    >
                        Retry
                    </button>
                </p>
            </div>
        );
    }

    if (!data) return null;

    const { stats, recentProjects, activeTasks, recentReliabilityEvents } = data;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── Quick stats row ── */}
            {stats && (
                <div style={{ display: "flex", gap: 10 }}>
                    <StatPill value={stats.tasksCompleted} label="Tasks done" color="#22c55e" />
                    <StatPill
                        value={stats.reliabilityScore !== null ? `${Math.round(stats.reliabilityScore)}%` : "—"}
                        label="Reliability"
                        color={
                            stats.reliabilityScore !== null
                                ? stats.reliabilityScore >= 80
                                    ? "#22c55e"
                                    : stats.reliabilityScore >= 60
                                        ? "#facc15"
                                        : "#e24b4a"
                                : "var(--muted)"
                        }
                    />
                    <StatPill value={stats.projectsCompleted} label="Projects" />
                </div>
            )}

            {/* ── Reliability preview ── */}
            <PreviewCard label="Reliability" tab="reliability" username={username} empty={recentReliabilityEvents.length === 0}>
                {recentReliabilityEvents.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {recentReliabilityEvents.map((e) => (
                            <div
                                key={e.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "7px 10px",
                                    borderRadius: 8,
                                    background: "var(--surface2)",
                                    border: "0.5px solid var(--border)",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        padding: "2px 7px",
                                        borderRadius: 4,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        background: `${EVENT_COLORS[e.eventType] ?? "#666"}18`,
                                        color: EVENT_COLORS[e.eventType] ?? "#666",
                                        flexShrink: 0,
                                    }}
                                >
                                    {e.eventType}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text)",
                                        flex: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {e.taskTitle ?? "Unnamed task"}
                                </span>
                                {e.scoreDelta !== 0 && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: e.scoreDelta > 0 ? "#22c55e" : "#e24b4a",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {e.scoreDelta > 0 ? "+" : ""}{e.scoreDelta.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </PreviewCard>

            {/* ── Projects preview ── */}
            <PreviewCard label="Project history" tab="projects" username={username} empty={recentProjects.length === 0}>
                {recentProjects.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {recentProjects.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    background: "var(--surface2)",
                                    border: "0.5px solid var(--border)",
                                }}
                            >
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: STATUS_COLORS[p.status] ?? "#666",
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text)",
                                        flex: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        fontWeight: 500,
                                    }}
                                >
                                    {p.title}
                                </span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: "var(--muted)",
                                        textTransform: "capitalize",
                                        flexShrink: 0,
                                    }}
                                >
                                    {p.role.replace(/_/g, " ")}
                                </span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 600,
                                        color: STATUS_COLORS[p.status] ?? "#666",
                                        textTransform: "uppercase",
                                        flexShrink: 0,
                                    }}
                                >
                                    {p.status.replace(/_/g, " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </PreviewCard>

            {/* ── Active tasks preview (owner only) ── */}
            {isOwner && (
                <PreviewCard label="Active tasks" tab="tasks" username={username} empty={activeTasks.length === 0}>
                    {activeTasks.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {activeTasks.map((t) => {
                                const overdue = t.dueDate && new Date(t.dueDate) < new Date();
                                return (
                                    <div
                                        key={t.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "7px 10px",
                                            borderRadius: 8,
                                            background: "var(--surface2)",
                                            border: "0.5px solid var(--border)",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: PRIORITY_COLORS[t.priority] ?? "#666",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "var(--text)",
                                                flex: 1,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t.title}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: "var(--muted)",
                                                flexShrink: 0,
                                                maxWidth: 100,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t.projectTitle}
                                        </span>
                                        {t.dueDate && (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: overdue ? "#ef4444" : "var(--muted)",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {overdue ? "⚠ " : ""}
                                                {new Date(t.dueDate).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </PreviewCard>
            )}

            {/* ── Reputation preview ── */}
            <PreviewCard label="Team reputation" tab="reputation" username={username}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {["Communication", "Execution", "Ownership"].map((r) => (
                        <div
                            key={r}
                            style={{
                                padding: "10px 8px",
                                borderRadius: 8,
                                border: "0.5px solid var(--border)",
                                background: "var(--surface2)",
                                textAlign: "center",
                            }}
                        >
                            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)", margin: 0 }}>—</p>
                            <p
                                style={{
                                    fontSize: 9,
                                    color: "var(--muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginTop: 3,
                                }}
                            >
                                {r}
                            </p>
                        </div>
                    ))}
                </div>
            </PreviewCard>

            {/* ── Timeline preview ── */}
            <PreviewCard label="Contribution timeline" tab="timeline" username={username}>
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: 7,
                        border: "0.5px dashed var(--border)",
                        background: "var(--surface2)",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            margin: 0,
                        }}
                    >
                        Coming soon — activity graph · task streaks · reviews done · teams formed
                    </p>
                </div>
            </PreviewCard>

            {/* ── Links preview ── */}
            <PreviewCard label="Links" tab="links" username={username}>
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: 7,
                        border: "0.5px dashed var(--border)",
                        background: "var(--surface2)",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            margin: 0,
                        }}
                    >
                        Coming soon — GitHub · LinkedIn · portfolio · Twitter/X
                    </p>
                </div>
            </PreviewCard>
        </div>
    );
}